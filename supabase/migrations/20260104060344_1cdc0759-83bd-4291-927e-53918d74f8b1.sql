-- Create storage bucket for dealer car images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dealer-car-images', 'dealer-car-images', true);

-- Allow anyone to view dealer car images
CREATE POLICY "Anyone can view dealer car images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dealer-car-images');

-- Allow dealers to upload images
CREATE POLICY "Dealers can upload car images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dealer-car-images' 
  AND is_dealer(auth.uid())
);

-- Allow dealers to update their uploaded images
CREATE POLICY "Dealers can update their car images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dealer-car-images' 
  AND is_dealer(auth.uid())
);

-- Allow dealers to delete their uploaded images
CREATE POLICY "Dealers can delete their car images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dealer-car-images' 
  AND is_dealer(auth.uid())
);

-- Add admin role for the specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('653fd7ed-f38b-4274-b28d-0cd2f45f9e9a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;