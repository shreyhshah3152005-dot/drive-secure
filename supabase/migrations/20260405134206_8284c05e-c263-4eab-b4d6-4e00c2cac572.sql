CREATE POLICY "Dealers can view all service bookings" ON public.service_bookings FOR SELECT TO authenticated USING (public.is_dealer(auth.uid()));

CREATE POLICY "Dealers can update service bookings" ON public.service_bookings FOR UPDATE TO authenticated USING (public.is_dealer(auth.uid())) WITH CHECK (public.is_dealer(auth.uid()));