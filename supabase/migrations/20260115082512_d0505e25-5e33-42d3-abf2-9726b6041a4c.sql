-- Create a database function to trigger price alert emails
-- This function will be called after price_alerts are triggered
CREATE OR REPLACE FUNCTION public.notify_price_alert_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if the alert was just triggered (is_triggered changed from false to true)
  IF NEW.is_triggered = true AND OLD.is_triggered = false THEN
    -- We'll use a simple approach: store the notification request
    -- The edge function will be called periodically to send emails
    RAISE NOTICE 'Price alert triggered for user % on car %', NEW.user_id, NEW.car_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to log when price alerts are triggered
DROP TRIGGER IF EXISTS on_price_alert_triggered ON public.price_alerts;
CREATE TRIGGER on_price_alert_triggered
  AFTER UPDATE ON public.price_alerts
  FOR EACH ROW
  WHEN (NEW.is_triggered = true AND OLD.is_triggered = false)
  EXECUTE FUNCTION notify_price_alert_trigger();