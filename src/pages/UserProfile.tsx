import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  User, Mail, Phone, MapPin, Camera, Upload, X, Save, Calendar,
  Sun, Moon, Trash2, AlertTriangle, Download, Pencil, ShieldCheck, LogOut, Settings,
} from "lucide-react";
import MyBookings from "@/components/MyBookings";
import MyServiceInvoices from "@/components/MyServiceInvoices";
import KycVerificationCard from "@/components/KycVerificationCard";
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
  const [activeTab, setActiveTab] = useState("overview");
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

  const initials = (profile?.name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-foreground font-medium truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        {/* Hero header */}
        <Card className="gradient-card border-border/50 overflow-hidden mb-8" aria-labelledby="profile-name">
          <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/40 via-primary/20 to-background relative" aria-hidden="true" />
          <CardContent className="pt-0 pb-5 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 -mt-10 sm:-mt-12">
              <div className="relative shrink-0">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={`${profile?.name || "User"}'s profile photo`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-background shadow-card"
                  />
                ) : (
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary border-4 border-background shadow-card flex items-center justify-center"
                    role="img"
                    aria-label={`${profile?.name || "User"} avatar placeholder`}
                  >
                    <span className="text-2xl font-bold text-foreground">{initials}</span>
                  </div>
                )}
                <button
                  onClick={() => document.getElementById("profile-pic-upload")?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={isUploading ? "Uploading profile photo" : "Change profile photo"}
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                </button>
                <input
                  id="profile-pic-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  aria-label="Upload profile photo"
                />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1
                  id="profile-name"
                  className="text-[1.65rem] sm:text-[2rem] leading-tight font-semibold tracking-tight text-white truncate drop-shadow-sm"
                >
                  {profile?.name || "Welcome"}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 min-w-0 max-w-full truncate" aria-label={`Email ${user?.email}`}>
                    <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{user?.email}</span>
                  </span>
                  {profile?.city && (
                    <span className="flex items-center gap-1.5 whitespace-nowrap" aria-label={`City ${profile.city}`}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {profile.city}
                    </span>
                  )}
                  {profile?.created_at && (
                    <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      Member since {format(new Date(profile.created_at), "MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 justify-start sm:justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={() => { setActiveTab("overview"); setIsEditing(true); setTimeout(() => document.getElementById("profile-name")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }}
                className="gap-2"
                aria-label="Edit profile details"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" /> Edit Profile
              </Button>
              {profile?.profile_image_url && (
                <Button variant="outline" size="sm" onClick={handleRemoveImage} className="gap-2" aria-label="Remove profile photo">
                  <X className="w-4 h-4" aria-hidden="true" /> Remove
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="gap-2"
                aria-label="Sign out of your account"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger value="overview" className="py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="py-2.5">Activity</TabsTrigger>
            <TabsTrigger value="verification" className="py-2.5">Verification</TabsTrigger>
            <TabsTrigger value="settings" className="py-2.5">Settings</TabsTrigger>
          </TabsList>


          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-foreground">Personal Information</CardTitle>
                  <CardDescription>Manage your contact details</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Your name" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={profile?.email || ""} disabled className="pl-10 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Your phone" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Your city" className="pl-10" />
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button variant="hero" className="flex-1 gap-2" onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-border/50">
                    <InfoRow icon={User} label="Full Name" value={profile?.name || "Not set"} />
                    <InfoRow icon={Mail} label="Email" value={user?.email || "—"} />
                    <InfoRow icon={Phone} label="Phone" value={profile?.phone || "Not set"} />
                    <InfoRow icon={MapPin} label="City" value={profile?.city || "Not set"} />
                    <InfoRow icon={Calendar} label="Member Since" value={profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy") : "N/A"} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity" className="space-y-6">
            <MyBookings />
            <MyServiceInvoices />
          </TabsContent>

          {/* VERIFICATION */}
          <TabsContent value="verification" className="space-y-6">
            <KycVerificationCard />
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-6">
            {/* Appearance */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Settings className="w-5 h-5 text-primary" /> Appearance
                </CardTitle>
                <CardDescription>Preview a theme for 3 seconds before switching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleThemePreview("light")}
                    disabled={previewTheme !== null}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      theme === "light" ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/50"
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
                      <span className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleThemePreview("dark")}
                    disabled={previewTheme !== null}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      theme === "dark" ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/50"
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
                      <span className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Active</span>
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

            {/* Data export */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Download className="w-5 h-5 text-primary" /> Export My Data
                </CardTitle>
                <CardDescription>Download all your data including favorites, reviews, and history</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2" onClick={() => handleExportData("json")}>
                  <Download className="w-4 h-4" /> Export as JSON
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handleExportData("csv")}>
                  <Download className="w-4 h-4" /> Export as CSV
                </Button>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Permanently delete your account and all associated data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-2"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete dialog */}
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
