
-- 1. Hide sensitive columns from anon on public directories
REVOKE SELECT (phone) ON public.dealers FROM anon;
REVOKE SELECT (phone, address) ON public.service_providers FROM anon;

-- 2. Remove anonymous read of loan / trade-in records
DROP POLICY IF EXISTS "Users can view their own preapprovals" ON public.loan_preapprovals;
CREATE POLICY "Users can view their own preapprovals"
ON public.loan_preapprovals FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create preapprovals" ON public.loan_preapprovals;
CREATE POLICY "Users can create preapprovals"
ON public.loan_preapprovals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own valuations" ON public.trade_in_valuations;
CREATE POLICY "Users can view their own valuations"
ON public.trade_in_valuations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create valuations" ON public.trade_in_valuations;
CREATE POLICY "Users can create valuations"
ON public.trade_in_valuations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Remove self-assigned dealer role policy
DROP POLICY IF EXISTS "Authenticated users can add their own dealer role" ON public.user_roles;

-- 4. Wishlist shares: drop public read, expose code-lookup RPC
DROP POLICY IF EXISTS "Anyone can view shares" ON public.wishlist_shares;

CREATE OR REPLACE FUNCTION public.get_wishlist_by_share_code(_code text)
RETURNS TABLE(car_ids text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT car_ids FROM public.wishlist_shares WHERE share_code = _code LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_wishlist_by_share_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_wishlist_by_share_code(text) TO anon, authenticated;

-- 5. Remove admin_notifications from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_notifications';
  END IF;
END $$;

-- 6. Restrict storage object listing on public buckets to authenticated users
DROP POLICY IF EXISTS "Anyone can view dealer car images" ON storage.objects;
CREATE POLICY "Authenticated users can list dealer car images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dealer-car-images');

DROP POLICY IF EXISTS "Anyone can view user profile images" ON storage.objects;
CREATE POLICY "Authenticated users can list user profile images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-profile-images');

DROP POLICY IF EXISTS "Dealer profile images are publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated users can list dealer profile images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dealer-profile-images');
