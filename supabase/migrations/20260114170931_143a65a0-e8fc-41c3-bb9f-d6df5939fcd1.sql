-- Fix overly permissive storage policies for dealer-car-images bucket
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Dealers can update their car images" ON storage.objects;
DROP POLICY IF EXISTS "Dealers can delete their car images" ON storage.objects;

-- Create ownership-based policies using folder structure (files are stored as {dealer_id}/filename)
CREATE POLICY "Dealers can update their own car images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dealer-car-images'
  AND is_dealer(auth.uid())
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.dealers WHERE user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Dealers can delete their own car images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dealer-car-images'
  AND is_dealer(auth.uid())
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.dealers WHERE user_id = auth.uid() LIMIT 1
  )
);