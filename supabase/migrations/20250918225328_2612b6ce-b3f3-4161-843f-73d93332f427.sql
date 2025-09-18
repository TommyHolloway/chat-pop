-- Add widget page restrictions column to agents table
ALTER TABLE public.agents 
ADD COLUMN widget_page_restrictions text[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN public.agents.widget_page_restrictions IS 'Array of URL patterns where the widget should load. Empty array means all pages.';