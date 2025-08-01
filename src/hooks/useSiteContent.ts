import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteContent {
  id: string;
  content_type: string;
  title: string | null;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useSiteContent(contentType: string = "landing_video") {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [contentType]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("content_type", contentType)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (err) {
      console.error("Error fetching site content:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  };

  const getActiveVideo = () => {
    return content.find(item => item.is_active) || null;
  };

  return {
    content,
    loading,
    error,
    refetch: fetchContent,
    activeVideo: getActiveVideo()
  };
}