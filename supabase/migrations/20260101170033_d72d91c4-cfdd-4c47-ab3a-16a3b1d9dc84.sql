-- Drop the overly permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.test_drive_inquiries;

-- Create a new policy that requires authenticated users and enforces user_id matching
CREATE POLICY "Authenticated users can create inquiries"
ON public.test_drive_inquiries
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);