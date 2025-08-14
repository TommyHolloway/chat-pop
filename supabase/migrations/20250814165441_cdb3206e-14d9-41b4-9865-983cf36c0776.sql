-- Add new columns to agents table for enhanced customization
ALTER TABLE public.agents 
ADD COLUMN profile_image_url TEXT,
ADD COLUMN message_bubble_color TEXT DEFAULT '#3B82F6',
ADD COLUMN chat_interface_theme TEXT DEFAULT 'dark';

-- Create storage bucket for agent avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-avatars', 'agent-avatars', true);

-- Create policies for agent avatar uploads
CREATE POLICY "Users can view agent avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Users can upload avatars for their agents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'agent-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update avatars for their agents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'agent-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete avatars for their agents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'agent-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);