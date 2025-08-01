-- Create site_content table for managing landing page videos
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Create policies for site content
CREATE POLICY "Anyone can view active site content" 
ON public.site_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all site content" 
ON public.site_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for site videos
INSERT INTO storage.buckets (id, name, public) VALUES ('site-videos', 'site-videos', true);

-- Create policies for site videos
CREATE POLICY "Anyone can view site videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'site-videos');

CREATE POLICY "Admins can upload site videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'site-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'site-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'site-videos' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();