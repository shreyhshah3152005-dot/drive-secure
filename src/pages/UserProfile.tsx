import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, MapPin, Camera, Upload, X, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(15),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(100),
});

interface ProfileData {
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  profile_image_url: string | null;
  created_at: string;
}

const UserProfile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", city: "" });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("name, email, phone, city, profile_image_url, created_at")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          city: data.city || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleSave = async () => {
    const validation = profileSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: formData.name, phone: formData.phone, city: formData.city })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile();
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      // Delete old image
      if (profile?.profile_image_url) {
        const oldPath = profile.profile_image_url.split("/user-profile-images/")[1];
        if (oldPath) await supabase.storage.from("user-profile-images").remove([oldPath]);
      }

      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-profile-images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("user-profile-images")
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("user_id", user.id);
      if (error) throw error;

      toast.success("Profile picture updated!");
      fetchProfile();
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !profile?.profile_image_url) return;
    try {
      const path = profile.profile_image_url.split("/user-profile-images/")[1];
      if (path) await supabase.storage.from("user-profile-images").remove([path]);
      await supabase.from("profiles").update({ profile_image_url: null }).eq("user_id", user.id);
      toast.success("Profile picture removed");
      fetchProfile();
    } catch {
      toast.error("Failed to remove image.");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">My Profile</h1>

        {/* Profile Picture */}
        <Card className="gradient-card border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Camera className="w-5 h-5 text-primary" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group">
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-4 border-border/50">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {profile?.profile_image_url && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-6 h-6"
                  onClick={handleRemoveImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div>
              <Button
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById("profile-pic-upload")?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
              <input
                id="profile-pic-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <p className="text-xs text-muted-foreground mt-2">JPEG, PNG or WebP, max 2MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="pl-10 bg-secondary/50 border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={profile?.email || ""} disabled className="pl-10 bg-secondary/30 border-border text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Your phone"
                      className="pl-10 bg-secondary/50 border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Your city"
                      className="pl-10 bg-secondary/50 border-border"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button variant="hero" className="flex-1 gap-2" onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-foreground font-medium">{profile?.name || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground font-medium">{profile?.phone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="text-foreground font-medium">{profile?.city || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-foreground font-medium">
                      {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <div className="mt-6 text-center">
          <Button variant="destructive" onClick={async () => { await signOut(); navigate("/"); }}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
