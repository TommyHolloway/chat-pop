-- Phase 2 Cleanup: Remove site content table and storage

-- Drop site content table
DROP TABLE IF EXISTS public.site_content CASCADE;

-- Note: Storage bucket 'site-videos' and related storage policies will need to be manually deleted from Supabase dashboard
-- Navigate to Storage > site-videos bucket and delete it there

-- Drop sync function if it exists (no longer used)
DROP FUNCTION IF EXISTS public.sync_auth_users_to_profiles() CASCADE;