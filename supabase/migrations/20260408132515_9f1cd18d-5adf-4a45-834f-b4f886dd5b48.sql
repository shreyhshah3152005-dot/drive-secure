
-- Add service_provider to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'service_provider';

-- Create service_providers table
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  city text NOT NULL,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_providers
CREATE POLICY "Anyone can view active service providers"
  ON public.service_providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service providers can view their own profile"
  ON public.service_providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service providers can update their own profile"
  ON public.service_providers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service provider record"
  ON public.service_providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all service providers"
  ON public.service_providers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a function to check if user is a service provider
CREATE OR REPLACE FUNCTION public.is_service_provider(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Update service_bookings RLS: let service providers see and update bookings
CREATE POLICY "Service providers can view all service bookings"
  ON public.service_bookings FOR SELECT TO authenticated
  USING (is_service_provider(auth.uid()));

CREATE POLICY "Service providers can update service bookings"
  ON public.service_bookings FOR UPDATE TO authenticated
  USING (is_service_provider(auth.uid()))
  WITH CHECK (is_service_provider(auth.uid()));
