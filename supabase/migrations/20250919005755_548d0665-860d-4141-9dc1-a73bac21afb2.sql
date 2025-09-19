-- First let me see the current function definition
SELECT routine_definition FROM information_schema.routines 
WHERE routine_name = 'get_public_agent_data' AND routine_schema = 'public';