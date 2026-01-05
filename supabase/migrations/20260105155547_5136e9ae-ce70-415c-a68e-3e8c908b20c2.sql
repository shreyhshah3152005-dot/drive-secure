-- Add profile_image_url column to dealers table
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Update the get_dealer_car_limit function to support 'free' plan
CREATE OR REPLACE FUNCTION public.get_dealer_car_limit(_dealer_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN subscription_plan = 'free' THEN 2
    WHEN subscription_plan = 'basic' THEN 5
    WHEN subscription_plan = 'standard' THEN 15
    WHEN subscription_plan = 'premium' THEN 999999
    ELSE 0
  END
  FROM public.dealers 
  WHERE id = _dealer_id
$$;

-- Update any existing dealers with 'basic' plan to 'free' plan if they have 0 cars
-- (New dealers will start with 'free' plan)

-- Allow authenticated users to insert their own dealer role (for dealer signup)
CREATE POLICY "Authenticated users can add their own dealer role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'dealer');

-- Create storage policies for dealer profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer-profile-images', 'dealer-profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view dealer profile images
CREATE POLICY "Dealer profile images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dealer-profile-images');

-- Allow dealers to upload their own profile image
CREATE POLICY "Dealers can upload their own profile image"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'dealer-profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow dealers to update their own profile image
CREATE POLICY "Dealers can update their own profile image"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'dealer-profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow dealers to delete their own profile image
CREATE POLICY "Dealers can delete their own profile image"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'dealer-profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);