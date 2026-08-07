-- 1. Storage: remove broad listing policies on public image buckets
DROP POLICY IF EXISTS "Authenticated users can list dealer car images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can list dealer profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can list user profile images" ON storage.objects;

-- 2. Helper: current user's active service provider id
CREATE OR REPLACE FUNCTION public.current_provider_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.service_providers
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- 3. service_bookings: assignable to a provider
ALTER TABLE public.service_bookings
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.service_providers(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Dealers can view all service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Dealers can update service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Service providers can view all service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Service providers can update service bookings" ON public.service_bookings;

CREATE POLICY "Providers can view assigned or unclaimed bookings"
ON public.service_bookings FOR SELECT TO authenticated
USING (
  public.current_provider_id() IS NOT NULL
  AND (
    provider_id = public.current_provider_id()
    OR (provider_id IS NULL AND status IN ('pending', 'confirmed'))
  )
);

CREATE POLICY "Providers can update assigned or unclaimed bookings"
ON public.service_bookings FOR UPDATE TO authenticated
USING (
  public.current_provider_id() IS NOT NULL
  AND (
    provider_id = public.current_provider_id()
    OR (provider_id IS NULL AND status IN ('pending', 'confirmed'))
  )
)
WITH CHECK (
  public.current_provider_id() IS NOT NULL
  AND (provider_id IS NULL OR provider_id = public.current_provider_id())
);

-- auto-claim booking when a provider acts on it
CREATE OR REPLACE FUNCTION public.claim_service_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.provider_id IS NULL AND public.current_provider_id() IS NOT NULL THEN
    NEW.provider_id := public.current_provider_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS claim_service_booking_trg ON public.service_bookings;
CREATE TRIGGER claim_service_booking_trg
BEFORE UPDATE ON public.service_bookings
FOR EACH ROW EXECUTE FUNCTION public.claim_service_booking();

-- 4. service_invoices: scope to provider's own invoices/bookings
DROP POLICY IF EXISTS "Service providers can view all invoices" ON public.service_invoices;
DROP POLICY IF EXISTS "Service providers can update invoices" ON public.service_invoices;

CREATE POLICY "Providers can view their own invoices"
ON public.service_invoices FOR SELECT TO authenticated
USING (
  public.current_provider_id() IS NOT NULL
  AND (
    provider_id = public.current_provider_id()
    OR EXISTS (
      SELECT 1 FROM public.service_bookings b
      WHERE b.id = service_invoices.booking_id
        AND b.provider_id = public.current_provider_id()
    )
  )
);

CREATE POLICY "Providers can update their own invoices"
ON public.service_invoices FOR UPDATE TO authenticated
USING (
  public.current_provider_id() IS NOT NULL
  AND (
    provider_id = public.current_provider_id()
    OR EXISTS (
      SELECT 1 FROM public.service_bookings b
      WHERE b.id = service_invoices.booking_id
        AND b.provider_id = public.current_provider_id()
    )
  )
)
WITH CHECK (
  public.current_provider_id() IS NOT NULL
);

-- stamp provider_id on invoice creation
CREATE OR REPLACE FUNCTION public.stamp_invoice_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.provider_id IS NULL THEN
    NEW.provider_id := public.current_provider_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_invoice_provider_trg ON public.service_invoices;
CREATE TRIGGER stamp_invoice_provider_trg
BEFORE INSERT ON public.service_invoices
FOR EACH ROW EXECUTE FUNCTION public.stamp_invoice_provider();

-- 5. service_audit_log: providers only see their own actions / their bookings
DROP POLICY IF EXISTS "Service providers can view all audit log" ON public.service_audit_log;

CREATE POLICY "Providers can view their own audit entries"
ON public.service_audit_log FOR SELECT TO authenticated
USING (
  public.current_provider_id() IS NOT NULL
  AND (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.service_bookings b
      WHERE b.id = service_audit_log.booking_id
        AND b.provider_id = public.current_provider_id()
    )
  )
);