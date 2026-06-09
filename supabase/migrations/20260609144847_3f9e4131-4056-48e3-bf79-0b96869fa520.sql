DROP POLICY IF EXISTS "Dealers can upload car images" ON storage.objects;
CREATE POLICY "Dealers can upload their own car images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dealer-car-images'
  AND public.is_dealer(auth.uid())
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.dealers WHERE user_id = auth.uid() LIMIT 1
  )
);