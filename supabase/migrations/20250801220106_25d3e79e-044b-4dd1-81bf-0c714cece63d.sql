-- Update the agent status from draft to active so it can be used by the public chat widget
UPDATE agents 
SET status = 'active', updated_at = now() 
WHERE id = 'be66d317-4d73-4394-8a16-fe59067ce716';