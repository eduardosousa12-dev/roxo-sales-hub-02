-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'closer', 'bdr', 'financeiro', 'gestor');
CREATE TYPE canal_type AS ENUM ('Inbound', 'Outbound', 'Webinar', 'Vanguarda');
CREATE TYPE qualificacao_type AS ENUM ('Qualificado', 'Não Qualificado', 'Não Identificado', 'Desconhecido');
CREATE TYPE reuniao_tipo AS ENUM ('R1', 'R2', 'R3', 'R4', 'R5', '-Sa', 'acima de 750k', '150k a 750k');
CREATE TYPE status_atividade AS ENUM ('Reunião Realizada', 'No Show', 'Reagendada');
CREATE TYPE evolucao_funil AS ENUM ('R1 > R2', 'R2 > R3', 'R3 > R4', 'R4 > R5', 'Nenhuma');
CREATE TYPE status_proposta AS ENUM ('Em Aberto', 'Ganho', 'Perdido');
CREATE TYPE status_pagamento AS ENUM ('Pago', 'Pendente', 'Parcial', 'Não Pago');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'closer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create leads/empresas table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  faturamento_empresa TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create atividades (daily logs) table
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  closer_id UUID REFERENCES public.profiles(id) NOT NULL,
  bdr_id UUID REFERENCES public.profiles(id),
  lead_id UUID REFERENCES public.leads(id) NOT NULL,
  canal canal_type NOT NULL,
  qualificacao qualificacao_type NOT NULL,
  reuniao_resgatada BOOLEAN DEFAULT FALSE,
  tipo_reuniao reuniao_tipo NOT NULL,
  status_atividade status_atividade NOT NULL,
  proposta_enviada BOOLEAN DEFAULT FALSE,
  evolucao_funil evolucao_funil DEFAULT 'Nenhuma',
  valor_proposta DECIMAL(12,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create propostas table
CREATE TABLE public.propostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) NOT NULL,
  closer_id UUID REFERENCES public.profiles(id) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  status status_proposta DEFAULT 'Em Aberto',
  data_envio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fechamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recebiveis table
CREATE TABLE public.recebiveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposta_id UUID REFERENCES public.propostas(id) NOT NULL,
  data_venda DATE NOT NULL,
  valor_venda DECIMAL(12,2) NOT NULL,
  valor_recebido DECIMAL(12,2) DEFAULT 0,
  saldo_devedor DECIMAL(12,2),
  status status_pagamento DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebiveis ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admin can do everything on profiles" ON public.profiles FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only super admin can manage roles" ON public.user_roles FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for leads
CREATE POLICY "Users can view all leads" ON public.leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admin can delete leads" ON public.leads FOR DELETE USING (public.is_super_admin(auth.uid()));

-- RLS Policies for atividades
CREATE POLICY "Users can view all activities" ON public.atividades FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create activities" ON public.atividades FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own activities" ON public.atividades FOR UPDATE USING (auth.uid() = closer_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin can delete activities" ON public.atividades FOR DELETE USING (public.is_super_admin(auth.uid()));

-- RLS Policies for propostas
CREATE POLICY "Users can view all proposals" ON public.propostas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create proposals" ON public.propostas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update proposals" ON public.propostas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admin can delete proposals" ON public.propostas FOR DELETE USING (public.is_super_admin(auth.uid()));

-- RLS Policies for recebiveis
CREATE POLICY "Users can view recebiveis" ON public.recebiveis FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with financeiro role can manage recebiveis" ON public.recebiveis FOR ALL USING (
  public.has_role(auth.uid(), 'financeiro') OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.is_super_admin(auth.uid())
);

-- Create trigger function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_atividades_updated_at BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON public.propostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recebiveis_updated_at BEFORE UPDATE ON public.recebiveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to auto-calculate saldo_devedor on recebiveis
CREATE OR REPLACE FUNCTION public.calculate_saldo_devedor()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_recebiveis_saldo BEFORE INSERT OR UPDATE ON public.recebiveis FOR EACH ROW EXECUTE FUNCTION public.calculate_saldo_devedor();