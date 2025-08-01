import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Video, Trash2 } from "lucide-react";

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

export function SiteContentManagement() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newContent, setNewContent] = useState({
    content_type: "landing_video",
    title: "",
    description: "",
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to fetch site content");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return null;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("site-videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-videos")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload video");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById("video-file") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      toast.error("Please select a video file");
      return;
    }

    const fileUrl = await handleFileUpload(file);
    if (!fileUrl) return;

    try {
      const { error } = await supabase
        .from("site_content")
        .insert({
          ...newContent,
          file_url: fileUrl
        });

      if (error) throw error;

      toast.success("Video uploaded successfully");
      setNewContent({
        content_type: "landing_video",
        title: "",
        description: "",
        is_active: true,
        display_order: 0
      });
      fileInput.value = "";
      fetchContent();
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("site_content")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(isActive ? "Video activated" : "Video deactivated");
      fetchContent();
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Failed to update content");
    }
  };

  const deleteContent = async (id: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("site-videos")
        .remove([fileName]);

      if (storageError) console.error("Storage deletion error:", storageError);

      // Delete from database
      const { error } = await supabase
        .from("site_content")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Video deleted successfully");
      fetchContent();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="Video title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={newContent.display_order}
                  onChange={(e) => setNewContent({ ...newContent, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newContent.description}
                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                placeholder="Video description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-file">Video File (MP4, WebM, MOV - Max 50MB)</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={newContent.is_active}
                onCheckedChange={(checked) => setNewContent({ ...newContent, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload Video"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Manage Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No videos uploaded yet. Upload your first video above.
            </p>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title || "Untitled"}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Uploaded {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) => toggleActive(item.id, checked)}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteContent(item.id, item.file_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <video
                    controls
                    className="w-full max-w-md rounded-lg"
                    preload="metadata"
                  >
                    <source src={item.file_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}