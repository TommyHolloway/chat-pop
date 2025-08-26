-- Move EccoChat Test Agent to 1st Workspace
UPDATE agents 
SET workspace_id = '8a6dc39b-8cd3-4761-bdf7-30c86e68660a'
WHERE id = 'be66d317-4d73-4394-8a16-fe59067ce716';