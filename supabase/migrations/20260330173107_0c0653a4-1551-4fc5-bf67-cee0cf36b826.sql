
-- Price negotiations table
CREATE TABLE public.price_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.dealer_cars(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  offer_price numeric NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  dealer_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_negotiations ENABLE ROW LEVEL SECURITY;

-- Users can view their own negotiations
CREATE POLICY "Users can view own negotiations" ON public.price_negotiations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create negotiations
CREATE POLICY "Users can create negotiations" ON public.price_negotiations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dealers can view negotiations for their cars
CREATE POLICY "Dealers can view their negotiations" ON public.price_negotiations
  FOR SELECT USING (dealer_id = get_dealer_id(auth.uid()));

-- Dealers can update negotiations for their cars
CREATE POLICY "Dealers can update their negotiations" ON public.price_negotiations
  FOR UPDATE USING (dealer_id = get_dealer_id(auth.uid()));

-- Admins can view all
CREATE POLICY "Admins can view all negotiations" ON public.price_negotiations
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Wishlist shares table
CREATE TABLE public.wishlist_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  share_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  car_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- Users can manage their own shares
CREATE POLICY "Users can manage own shares" ON public.wishlist_shares
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view shares by code (public access for sharing)
CREATE POLICY "Anyone can view shares" ON public.wishlist_shares
  FOR SELECT USING (true);
