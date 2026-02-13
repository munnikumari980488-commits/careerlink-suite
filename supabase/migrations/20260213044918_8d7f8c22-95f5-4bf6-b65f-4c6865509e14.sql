
-- Add profile image and company logo columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_description text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_address text;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view profile images (public bucket)
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can view all employer profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
