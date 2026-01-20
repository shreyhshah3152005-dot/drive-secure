
-- Create saved_searches table for user search preferences
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  fuel_type TEXT,
  category TEXT,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dealer_availability table for managing time slots
CREATE TABLE public.dealer_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dealer_blocked_slots for blocked/unavailable times
CREATE TABLE public.dealer_blocked_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade_in_valuations table
CREATE TABLE public.trade_in_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  condition TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_preapprovals table
CREATE TABLE public.loan_preapprovals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  car_price NUMERIC NOT NULL,
  down_payment NUMERIC NOT NULL,
  loan_term INTEGER NOT NULL,
  credit_score_range TEXT NOT NULL,
  annual_income NUMERIC NOT NULL,
  monthly_payment NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_preapprovals ENABLE ROW LEVEL SECURITY;

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches"
ON public.saved_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
ON public.saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
ON public.saved_searches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
ON public.saved_searches FOR DELETE
USING (auth.uid() = user_id);

-- Dealer availability policies
CREATE POLICY "Anyone can view dealer availability"
ON public.dealer_availability FOR SELECT
USING (true);

CREATE POLICY "Dealers can manage their own availability"
ON public.dealer_availability FOR ALL
USING (dealer_id = get_dealer_id(auth.uid()));

-- Dealer blocked slots policies
CREATE POLICY "Anyone can view dealer blocked slots"
ON public.dealer_blocked_slots FOR SELECT
USING (true);

CREATE POLICY "Dealers can manage their own blocked slots"
ON public.dealer_blocked_slots FOR ALL
USING (dealer_id = get_dealer_id(auth.uid()));

-- Trade-in valuations policies
CREATE POLICY "Users can view their own valuations"
ON public.trade_in_valuations FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create valuations"
ON public.trade_in_valuations FOR INSERT
WITH CHECK (true);

-- Loan preapprovals policies
CREATE POLICY "Users can view their own preapprovals"
ON public.loan_preapprovals FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create preapprovals"
ON public.loan_preapprovals FOR INSERT
WITH CHECK (true);
