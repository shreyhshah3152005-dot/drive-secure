import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DealerProfileImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

const DealerProfileImageUpload = ({ imageUrl, onImageChange }: DealerProfileImageUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      // Delete old image if exists
      if (imageUrl) {
        const oldPath = imageUrl.split("/dealer-profile-images/")[1];
        if (oldPath) {
          await supabase.storage.from("dealer-profile-images").remove([oldPath]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from("dealer-profile-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("dealer-profile-images")
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast.success("Profile image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl || !user) return;

    try {
      const path = imageUrl.split("/dealer-profile-images/")[1];
      if (path) {
        await supabase.storage.from("dealer-profile-images").remove([path]);
      }
      onImageChange(null);
      toast.success("Profile image removed");
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Profile Image</label>
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6"
              onClick={handleRemoveImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("profile-image-upload")?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
          <input
            id="profile-image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG or WebP, max 2MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default DealerProfileImageUpload;