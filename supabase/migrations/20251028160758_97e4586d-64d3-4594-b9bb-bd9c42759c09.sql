-- Create RLS policies for agent-files storage bucket
-- This ensures users can only access files belonging to their own agents

-- Policy: Users can view their own agent files
CREATE POLICY "Users can view their own agent files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Policy: Users can upload files to their own agents
CREATE POLICY "Users can upload files to their own agents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update files for their own agents
CREATE POLICY "Users can update files for their own agents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete files for their own agents
CREATE POLICY "Users can delete files for their own agents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid()
  )
);