-- Add SELECT policy for admins to view all test drive inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.test_drive_inquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));