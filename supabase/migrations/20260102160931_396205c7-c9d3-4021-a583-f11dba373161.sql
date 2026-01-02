-- Add 'dealer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dealer';

-- Create dealers table
CREATE TABLE public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'standard', 'premium')),
  subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dealer_cars table for cars added by dealers
CREATE TABLE public.dealer_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  seating_capacity INTEGER NOT NULL DEFAULT 5,
  mileage TEXT,
  engine TEXT,
  power TEXT,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_notifications table for in-app notifications
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dealer_test_drives table to link test drives to dealers
ALTER TABLE public.test_drive_inquiries 
ADD COLUMN dealer_id UUID REFERENCES public.dealers(id),
ADD COLUMN dealer_review TEXT,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all new tables
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is a dealer
CREATE OR REPLACE FUNCTION public.is_dealer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dealers
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Create function to get dealer id for a user
CREATE OR REPLACE FUNCTION public.get_dealer_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.dealers WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to get dealer car limit based on subscription
CREATE OR REPLACE FUNCTION public.get_dealer_car_limit(_dealer_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN subscription_plan = 'basic' THEN 5
    WHEN subscription_plan = 'standard' THEN 15
    WHEN subscription_plan = 'premium' THEN 999999
    ELSE 0
  END
  FROM public.dealers 
  WHERE id = _dealer_id
$$;

-- Create function to count dealer cars
CREATE OR REPLACE FUNCTION public.get_dealer_car_count(_dealer_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.dealer_cars WHERE dealer_id = _dealer_id AND is_active = true
$$;

-- RLS Policies for dealers table
CREATE POLICY "Admins can view all dealers"
ON public.dealers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Dealers can view their own profile"
ON public.dealers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dealers"
ON public.dealers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Dealers can update their own profile"
ON public.dealers FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for dealer_cars table
CREATE POLICY "Anyone can view active dealer cars"
ON public.dealer_cars FOR SELECT
USING (is_active = true);

CREATE POLICY "Dealers can manage their own cars"
ON public.dealer_cars FOR ALL
USING (dealer_id = public.get_dealer_id(auth.uid()));

CREATE POLICY "Admins can manage all dealer cars"
ON public.dealer_cars FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_notifications table
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
ON public.admin_notifications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (true);

-- Update test_drive_inquiries policies for dealers
CREATE POLICY "Dealers can view their own test drives"
ON public.test_drive_inquiries FOR SELECT
USING (dealer_id = public.get_dealer_id(auth.uid()));

CREATE POLICY "Dealers can update their own test drives"
ON public.test_drive_inquiries FOR UPDATE
USING (dealer_id = public.get_dealer_id(auth.uid()));

-- Create trigger to add admin notification on new test drive
CREATE OR REPLACE FUNCTION public.notify_admin_on_test_drive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, data)
  VALUES (
    'test_drive_request',
    'New Test Drive Request',
    'New test drive request for ' || NEW.car_name || ' from ' || NEW.name,
    jsonb_build_object(
      'inquiry_id', NEW.id,
      'car_name', NEW.car_name,
      'customer_name', NEW.name,
      'customer_email', NEW.email,
      'preferred_date', NEW.preferred_date,
      'preferred_time', NEW.preferred_time
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_test_drive_created
  AFTER INSERT ON public.test_drive_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_test_drive();

-- Create triggers for updated_at
CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dealer_cars_updated_at
  BEFORE UPDATE ON public.dealer_cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();