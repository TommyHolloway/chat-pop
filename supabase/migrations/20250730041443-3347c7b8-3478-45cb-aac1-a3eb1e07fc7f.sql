-- Add missing UPDATE policy for knowledge_files table
-- This policy allows users to update files for their own agents
CREATE POLICY "Users can update files for their agents" 
ON knowledge_files 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 
  FROM agents 
  WHERE agents.id = knowledge_files.agent_id 
  AND agents.user_id = auth.uid()
));