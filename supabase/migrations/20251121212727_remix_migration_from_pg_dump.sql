CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'closer',
    'bdr',
    'financeiro',
    'gestor'
);


--
-- Name: canal_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.canal_type AS ENUM (
    'Inbound',
    'Outbound',
    'Webinar',
    'Vanguarda'
);


--
-- Name: evolucao_funil; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.evolucao_funil AS ENUM (
    'R1 > R2',
    'R2 > R3',
    'R3 > R4',
    'R4 > R5',
    'Nenhuma'
);


--
-- Name: qualificacao_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.qualificacao_type AS ENUM (
    'Qualificado',
    'Não Qualificado',
    'Não Identificado',
    'Desconhecido'
);


--
-- Name: reuniao_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reuniao_tipo AS ENUM (
    'R1',
    'R2',
    'R3',
    'R4',
    'R5',
    '-Sa',
    'acima de 750k',
    '150k a 750k'
);


--
-- Name: status_atividade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_atividade AS ENUM (
    'Reunião Realizada',
    'No Show',
    'Reagendada'
);


--
-- Name: status_pagamento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_pagamento AS ENUM (
    'Pago',
    'Pendente',
    'Parcial',
    'Não Pago'
);


--
-- Name: status_proposta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_proposta AS ENUM (
    'Em Aberto',
    'Ganho',
    'Perdido'
);


--
-- Name: calculate_saldo_devedor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_saldo_devedor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.saldo_devedor = NEW.valor_venda - COALESCE(NEW.valor_recebido, 0);
  
  -- Update status based on payment
  IF NEW.saldo_devedor = 0 THEN
    NEW.status = 'Pago';
  ELSIF NEW.valor_recebido > 0 THEN
    NEW.status = 'Parcial';
  ELSE
    NEW.status = 'Pendente';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: check_super_admin_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_super_admin_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if this is the super admin email
  IF NEW.email = 'micaias@gruporugido.com' THEN
    -- Delete the default 'closer' role that was auto-assigned
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'closer';
    
    -- Assign super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email)
  );
  
  -- Assign default 'closer' role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'closer');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: atividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atividades (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    data date DEFAULT CURRENT_DATE NOT NULL,
    closer_id uuid NOT NULL,
    bdr_id uuid,
    lead_id uuid NOT NULL,
    canal public.canal_type NOT NULL,
    qualificacao public.qualificacao_type NOT NULL,
    reuniao_resgatada boolean DEFAULT false,
    tipo_reuniao public.reuniao_tipo NOT NULL,
    status_atividade public.status_atividade NOT NULL,
    proposta_enviada boolean DEFAULT false,
    evolucao_funil public.evolucao_funil DEFAULT 'Nenhuma'::public.evolucao_funil,
    valor_proposta numeric(12,2),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nome text NOT NULL,
    faturamento_empresa text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    nome_completo text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: propostas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propostas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    closer_id uuid NOT NULL,
    valor numeric(12,2) NOT NULL,
    status public.status_proposta DEFAULT 'Em Aberto'::public.status_proposta,
    data_envio date DEFAULT CURRENT_DATE NOT NULL,
    data_fechamento date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: recebiveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recebiveis (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    proposta_id uuid NOT NULL,
    data_venda date NOT NULL,
    valor_venda numeric(12,2) NOT NULL,
    valor_recebido numeric(12,2) DEFAULT 0,
    saldo_devedor numeric(12,2),
    status public.status_pagamento DEFAULT 'Pendente'::public.status_pagamento,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'closer'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: atividades atividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT atividades_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: propostas propostas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas
    ADD CONSTRAINT propostas_pkey PRIMARY KEY (id);


--
-- Name: recebiveis recebiveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebiveis
    ADD CONSTRAINT recebiveis_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: recebiveis calculate_recebiveis_saldo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER calculate_recebiveis_saldo BEFORE INSERT OR UPDATE ON public.recebiveis FOR EACH ROW EXECUTE FUNCTION public.calculate_saldo_devedor();


--
-- Name: profiles check_super_admin_on_profile; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER check_super_admin_on_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_super_admin_email();


--
-- Name: atividades update_atividades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_atividades_updated_at BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: propostas update_propostas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON public.propostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recebiveis update_recebiveis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recebiveis_updated_at BEFORE UPDATE ON public.recebiveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: atividades atividades_bdr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT atividades_bdr_id_fkey FOREIGN KEY (bdr_id) REFERENCES public.profiles(id);


--
-- Name: atividades atividades_closer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT atividades_closer_id_fkey FOREIGN KEY (closer_id) REFERENCES public.profiles(id);


--
-- Name: atividades atividades_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT atividades_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);


--
-- Name: leads leads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: propostas propostas_closer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas
    ADD CONSTRAINT propostas_closer_id_fkey FOREIGN KEY (closer_id) REFERENCES public.profiles(id);


--
-- Name: propostas propostas_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas
    ADD CONSTRAINT propostas_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);


--
-- Name: recebiveis recebiveis_proposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebiveis
    ADD CONSTRAINT recebiveis_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.propostas(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles Only super admin can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only super admin can manage roles" ON public.user_roles USING (public.is_super_admin(auth.uid()));


--
-- Name: atividades Super admin can delete activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can delete activities" ON public.atividades FOR DELETE USING (public.is_super_admin(auth.uid()));


--
-- Name: leads Super admin can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can delete leads" ON public.leads FOR DELETE USING (public.is_super_admin(auth.uid()));


--
-- Name: propostas Super admin can delete proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can delete proposals" ON public.propostas FOR DELETE USING (public.is_super_admin(auth.uid()));


--
-- Name: profiles Super admin can do everything on profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can do everything on profiles" ON public.profiles USING (public.is_super_admin(auth.uid()));


--
-- Name: atividades Users can create activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create activities" ON public.atividades FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: leads Users can create leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create leads" ON public.leads FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: propostas Users can create proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create proposals" ON public.propostas FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: leads Users can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: atividades Users can update own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own activities" ON public.atividades FOR UPDATE USING (((auth.uid() = closer_id) OR public.is_super_admin(auth.uid())));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: propostas Users can update proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update proposals" ON public.propostas FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: atividades Users can view all activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all activities" ON public.atividades FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: leads Users can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all leads" ON public.leads FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: propostas Users can view all proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all proposals" ON public.propostas FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: user_roles Users can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);


--
-- Name: recebiveis Users can view recebiveis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view recebiveis" ON public.recebiveis FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: recebiveis Users with financeiro role can manage recebiveis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users with financeiro role can manage recebiveis" ON public.recebiveis USING ((public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid())));


--
-- Name: atividades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: propostas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

--
-- Name: recebiveis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recebiveis ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


