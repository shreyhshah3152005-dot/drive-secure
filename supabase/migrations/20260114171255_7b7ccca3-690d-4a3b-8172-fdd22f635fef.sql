-- Add verification_status column to dealers table
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified' 
CHECK (verification_status IN ('unverified', 'verified', 'trusted', 'premium_partner'));

-- Create price_alerts table for user price threshold alerts
CREATE TABLE public.price_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  car_id uuid NOT NULL REFERENCES public.dealer_cars(id) ON DELETE CASCADE,
  target_price numeric NOT NULL,
  is_triggered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  triggered_at timestamp with time zone
);

-- Enable RLS on price_alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own price alerts
CREATE POLICY "Users can view their own price alerts"
ON public.price_alerts FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own price alerts
CREATE POLICY "Users can create their own price alerts"
ON public.price_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own price alerts
CREATE POLICY "Users can delete their own price alerts"
ON public.price_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own price alerts
CREATE POLICY "Users can update their own price alerts"
ON public.price_alerts FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to check and trigger price alerts when car price changes
CREATE OR REPLACE FUNCTION public.check_price_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If price decreased, check for alerts that should be triggered
  IF NEW.price < OLD.price THEN
    UPDATE public.price_alerts
    SET is_triggered = true, triggered_at = now()
    WHERE car_id = NEW.id 
      AND target_price >= NEW.price 
      AND is_triggered = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check price alerts on price change
CREATE TRIGGER check_price_alerts_trigger
AFTER UPDATE ON public.dealer_cars
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)
EXECUTE FUNCTION public.check_price_alerts();

-- Add index for better performance
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_car_id ON public.price_alerts(car_id);
CREATE INDEX idx_price_alerts_triggered ON public.price_alerts(is_triggered) WHERE is_triggered = true;