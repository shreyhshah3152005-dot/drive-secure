import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, MapPin, Camera, Upload, X, Save, Calendar, Sun, Moon, Trash2, AlertTriangle, Download } from "lucide-react";
import MyBookings from "@/components/MyBookings";
import MyServiceInvoices from "@/components/MyServiceInvoices";
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
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
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

  // Theme preview: temporarily switch theme, revert after 3 seconds
  const handleThemePreview = (previewMode: string) => {
    const currentTheme = theme;
    setPreviewTheme(previewMode);
    setTheme(previewMode);
    setTimeout(() => {
      setTheme(currentTheme || "dark");
      setPreviewTheme(null);
    }, 3000);
  };

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

  const handleExportData = async (format: "json" | "csv") => {
    if (!user) return;
    try {
      toast.info("Preparing your data export...");
      const [favoritesRes, reviewsRes, comparisonsRes, savedSearchesRes, testDrivesRes] = await Promise.all([
        supabase.from("favorites").select("*").eq("user_id", user.id),
        supabase.from("car_reviews").select("*").eq("user_id", user.id),
        supabase.from("comparison_history").select("*").eq("user_id", user.id),
        supabase.from("saved_searches").select("*").eq("user_id", user.id),
        supabase.from("test_drive_inquiries").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        profile: { name: profile?.name, email: profile?.email, phone: profile?.phone, city: profile?.city },
        favorites: favoritesRes.data || [],
        reviews: reviewsRes.data || [],
        comparisons: comparisonsRes.data || [],
        saved_searches: savedSearchesRes.data || [],
        test_drives: testDrivesRes.data || [],
        exported_at: new Date().toISOString(),
      };

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        filename = `carbazaar-data-${Date.now()}.json`;
      } else {
        const rows: string[] = [];
        for (const [section, data] of Object.entries(exportData)) {
          if (Array.isArray(data) && data.length > 0) {
            rows.push(`\n--- ${section.toUpperCase()} ---`);
            rows.push(Object.keys(data[0]).join(","));
            data.forEach((item: Record<string, unknown>) => rows.push(Object.values(item).map(v => `"${String(v ?? "")}"`).join(",")));
          }
        }
        rows.unshift("CARBAZAAR Data Export");
        blob = new Blob([rows.join("\n")], { type: "text/csv" });
        filename = `carbazaar-data-${Date.now()}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Data exported as ${format.toUpperCase()}!`);
    } catch {
      toast.error("Failed to export data.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      toast.success("Account deleted successfully. Goodbye!");
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
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

        {/* Theme Preview */}
        <Card className="gradient-card border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sun className="w-5 h-5 text-primary" />
              Theme Preview
            </CardTitle>
            <CardDescription>
              Preview how your profile looks in different themes. Click to preview for 3 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Light Preview */}
              <button
                onClick={() => handleThemePreview("light")}
                disabled={previewTheme !== null}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  theme === "light"
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/50 hover:border-primary/50"
                } ${previewTheme === "light" ? "animate-pulse" : ""}`}
              >
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="space-y-1 flex-1">
                      <div className="h-2 bg-gray-800 rounded w-3/4" />
                      <div className="h-1.5 bg-gray-400 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 bg-gray-100 rounded" />
                    <div className="h-2 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">Light</span>
                </div>
                {theme === "light" && (
                  <span className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              {/* Dark Preview */}
              <button
                onClick={() => handleThemePreview("dark")}
                disabled={previewTheme !== null}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  theme === "dark"
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/50 hover:border-primary/50"
                } ${previewTheme === "dark" ? "animate-pulse" : ""}`}
              >
                <div className="bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700" />
                    <div className="space-y-1 flex-1">
                      <div className="h-2 bg-gray-200 rounded w-3/4" />
                      <div className="h-1.5 bg-gray-500 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 bg-gray-800 rounded" />
                    <div className="h-2 bg-gray-800 rounded w-5/6" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-foreground">Dark</span>
                </div>
                {theme === "dark" && (
                  <span className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
            {previewTheme && (
              <p className="text-sm text-primary text-center mt-3 animate-pulse">
                Previewing {previewTheme} mode... reverting in 3 seconds
              </p>
            )}
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

        {/* My Bookings */}
        <div className="mt-6">
          <MyBookings />
          <MyServiceInvoices />
        </div>

        {/* Data Export */}
        <Card className="gradient-card border-border/50 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Download className="w-5 h-5 text-primary" />
              Export My Data
            </CardTitle>
            <CardDescription>Download all your data including favorites, reviews, and history.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={() => handleExportData("json")}>
              <Download className="w-4 h-4" /> Export as JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleExportData("csv")}>
              <Download className="w-4 h-4" /> Export as CSV
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="destructive" onClick={async () => { await signOut(); navigate("/"); }}>
            Sign Out
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="gradient-card border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Account Permanently
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This action is <strong className="text-foreground">irreversible</strong>. All your data including profile, favorites, test drive history, reviews, and saved searches will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">⚠️ You will lose:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Your profile and personal data</li>
                  <li>All favorites and saved searches</li>
                  <li>Test drive booking history</li>
                  <li>Reviews and comparison history</li>
                </ul>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Type <span className="text-destructive font-bold">DELETE</span> to confirm
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? "Deleting..." : "Delete My Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserProfile;
