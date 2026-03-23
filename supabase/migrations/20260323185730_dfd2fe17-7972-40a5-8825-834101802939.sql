-- Add profile_image_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Create storage bucket for user profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('user-profile-images', 'user-profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view user profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profile-images');