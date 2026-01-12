-- ============ SECURITY FIXES ============

-- Fix 1: Drop overly permissive insert policy on admin_notifications
-- The trigger notify_admin_on_test_drive() runs with SECURITY DEFINER so it can still insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- ============ FAVORITE DEALERS TABLE ============

-- Create favorite_dealers table for users to save favorite dealers
CREATE TABLE public.favorite_dealers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dealer_id)
);

-- Enable RLS on favorite_dealers
ALTER TABLE public.favorite_dealers ENABLE ROW LEVEL SECURITY;

-- Policies for favorite_dealers
CREATE POLICY "Users can view their own favorite dealers"
ON public.favorite_dealers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorite dealers"
ON public.favorite_dealers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite dealers"
ON public.favorite_dealers FOR DELETE
USING (auth.uid() = user_id);

-- ============ DEALER NEW CAR NOTIFICATIONS TABLE ============

-- Create table to store notifications for new cars added by favorite dealers
CREATE TABLE public.dealer_car_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.dealer_cars(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dealer_car_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for dealer_car_notifications
CREATE POLICY "Users can view their own notifications"
ON public.dealer_car_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.dealer_car_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.dealer_car_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Policy for system to insert (via trigger with SECURITY DEFINER)
-- No INSERT policy needed as the trigger runs with SECURITY DEFINER

-- ============ TRIGGER FOR NEW CAR NOTIFICATIONS ============

-- Function to notify users who favorited a dealer when they add a new car
CREATE OR REPLACE FUNCTION public.notify_favorite_dealer_new_car()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notifications for all users who have favorited this dealer
  INSERT INTO public.dealer_car_notifications (user_id, dealer_id, car_id)
  SELECT fd.user_id, NEW.dealer_id, NEW.id
  FROM public.favorite_dealers fd
  WHERE fd.dealer_id = NEW.dealer_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on dealer_cars table for new car insertions
CREATE TRIGGER trigger_notify_favorite_dealer_new_car
AFTER INSERT ON public.dealer_cars
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.notify_favorite_dealer_new_car();

-- Enable realtime for dealer_car_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.dealer_car_notifications;