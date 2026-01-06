-- Allow admins to view all profiles for customer management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all comparison history for customer insights
CREATE POLICY "Admins can view all comparison history"
ON public.comparison_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));