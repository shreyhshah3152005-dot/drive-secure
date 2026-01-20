
-- Fix overly permissive RLS policies by adding user_id checks
DROP POLICY IF EXISTS "Anyone can create valuations" ON public.trade_in_valuations;
DROP POLICY IF EXISTS "Anyone can create preapprovals" ON public.loan_preapprovals;

-- More restrictive policies for trade_in_valuations
CREATE POLICY "Users can create valuations"
ON public.trade_in_valuations FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- More restrictive policies for loan_preapprovals
CREATE POLICY "Users can create preapprovals"
ON public.loan_preapprovals FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
