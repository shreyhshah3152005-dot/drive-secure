
-- Payment status fields on service invoices
ALTER TABLE public.service_invoices
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Audit log for service/wash done & undo events
CREATE TABLE IF NOT EXISTS public.service_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action_type text NOT NULL, -- 'service_done','service_undo','wash_done','wash_undo','status_change'
  previous_value text,
  new_value text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.service_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service providers can insert audit log"
  ON public.service_audit_log FOR INSERT
  WITH CHECK (public.is_service_provider(auth.uid()) AND actor_id = auth.uid());

CREATE POLICY "Service providers can view all audit log"
  ON public.service_audit_log FOR SELECT
  USING (public.is_service_provider(auth.uid()));

CREATE POLICY "Customers can view their own audit log"
  ON public.service_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage audit log"
  ON public.service_audit_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_service_audit_booking ON public.service_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_service_audit_user ON public.service_audit_log(user_id);
