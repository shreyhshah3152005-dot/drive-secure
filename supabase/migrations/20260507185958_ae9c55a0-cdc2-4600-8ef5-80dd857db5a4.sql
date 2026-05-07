
CREATE TABLE public.service_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL DEFAULT ('INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
  booking_id uuid NOT NULL,
  user_id uuid NOT NULL,
  provider_id uuid,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  service_description text,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  labor_charge numeric NOT NULL DEFAULT 0,
  parts_total numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_percent numeric NOT NULL DEFAULT 18,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own invoices"
  ON public.service_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service providers can view all invoices"
  ON public.service_invoices FOR SELECT
  USING (public.is_service_provider(auth.uid()));

CREATE POLICY "Service providers can create invoices"
  ON public.service_invoices FOR INSERT
  WITH CHECK (public.is_service_provider(auth.uid()));

CREATE POLICY "Service providers can update invoices"
  ON public.service_invoices FOR UPDATE
  USING (public.is_service_provider(auth.uid()));

CREATE POLICY "Admins can manage invoices"
  ON public.service_invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_service_invoices_updated_at
  BEFORE UPDATE ON public.service_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_service_invoices_booking ON public.service_invoices(booking_id);
CREATE INDEX idx_service_invoices_user ON public.service_invoices(user_id);
