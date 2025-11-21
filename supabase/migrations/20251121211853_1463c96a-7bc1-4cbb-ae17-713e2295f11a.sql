-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix search_path for calculate_saldo_devedor function
CREATE OR REPLACE FUNCTION public.calculate_saldo_devedor()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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