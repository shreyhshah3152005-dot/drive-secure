-- 1. Create price_history table to track car price changes
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.dealer_cars(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view price history
CREATE POLICY "Anyone can view price history"
ON public.price_history FOR SELECT
USING (true);

-- Dealers can insert price history for their cars
CREATE POLICY "Dealers can insert price history"
ON public.price_history FOR INSERT
WITH CHECK (dealer_id = get_dealer_id(auth.uid()));

-- 2. Create dealer_reviews table for test drive experience ratings
CREATE TABLE public.dealer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_drive_id UUID NOT NULL REFERENCES public.test_drive_inquiries(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_drive_id)
);

-- Enable RLS
ALTER TABLE public.dealer_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view dealer reviews
CREATE POLICY "Anyone can view dealer reviews"
ON public.dealer_reviews FOR SELECT
USING (true);

-- Users can create reviews for their own test drives
CREATE POLICY "Users can create their own reviews"
ON public.dealer_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.dealer_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.dealer_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage dealer reviews"
ON public.dealer_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create trigger to record price history when car price changes
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record on INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.price_history (car_id, dealer_id, price)
    VALUES (NEW.id, NEW.dealer_id, NEW.price);
    RETURN NEW;
  END IF;
  
  -- Record on UPDATE only if price changed
  IF TG_OP = 'UPDATE' AND NEW.price != OLD.price THEN
    INSERT INTO public.price_history (car_id, dealer_id, price)
    VALUES (NEW.id, NEW.dealer_id, NEW.price);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for price history
CREATE TRIGGER track_price_changes
AFTER INSERT OR UPDATE ON public.dealer_cars
FOR EACH ROW
EXECUTE FUNCTION public.record_price_history();

-- 4. Alter dealers table to set default is_active to false for approval workflow
ALTER TABLE public.dealers ALTER COLUMN is_active SET DEFAULT false;