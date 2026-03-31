
CREATE TABLE public.service_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.dealer_cars(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  mileage_at_service INTEGER,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service history" ON public.service_history FOR SELECT USING (true);
CREATE POLICY "Dealers can manage their car service history" ON public.service_history FOR ALL USING (dealer_id = get_dealer_id(auth.uid()));
