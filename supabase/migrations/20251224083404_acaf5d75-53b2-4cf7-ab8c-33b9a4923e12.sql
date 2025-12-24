-- Create comparison_history table
CREATE TABLE public.comparison_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  car_ids TEXT[] NOT NULL,
  car_names TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for comparison_history
ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for comparison_history
CREATE POLICY "Users can view their own comparison history"
ON public.comparison_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own comparison history"
ON public.comparison_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comparison history"
ON public.comparison_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create car_reviews table
CREATE TABLE public.car_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  car_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for car_reviews
ALTER TABLE public.car_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for car_reviews
CREATE POLICY "Anyone can view reviews"
ON public.car_reviews
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reviews"
ON public.car_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.car_reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.car_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_car_reviews_updated_at
BEFORE UPDATE ON public.car_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();