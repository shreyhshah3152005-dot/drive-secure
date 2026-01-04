-- Allow any authenticated user to insert their own dealer record
CREATE POLICY "Users can create their own dealer record"
ON public.dealers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view active dealers (for the dealers listing page)
CREATE POLICY "Anyone can view active dealers"
ON public.dealers
FOR SELECT
USING (is_active = true);