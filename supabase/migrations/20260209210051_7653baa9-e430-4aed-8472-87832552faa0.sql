-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- Allow anyone to view generated images (public bucket)
CREATE POLICY "Generated images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

-- Allow authenticated users to upload images (edge functions use service role, but also allow auth users)
CREATE POLICY "Authenticated users can upload generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

-- Allow service role to upload (edge functions)
CREATE POLICY "Service role can upload generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images');

-- Allow users to delete their images
CREATE POLICY "Authenticated users can delete generated images"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-images' AND auth.role() = 'authenticated');