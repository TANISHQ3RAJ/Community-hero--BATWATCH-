-- Create a bucket for issue media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue_media', 'issue_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Public media is viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'issue_media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'issue_media' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own uploaded media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'issue_media' AND auth.uid() = owner
);

CREATE POLICY "Users can delete their own uploaded media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'issue_media' AND auth.uid() = owner
);
