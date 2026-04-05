ALTER TABLE public.service_bookings
  ADD COLUMN package_duration_months integer NOT NULL DEFAULT 12,
  ADD COLUMN total_services integer NOT NULL DEFAULT 2,
  ADD COLUMN total_washes integer NOT NULL DEFAULT 3,
  ADD COLUMN services_used integer NOT NULL DEFAULT 0,
  ADD COLUMN washes_used integer NOT NULL DEFAULT 0;