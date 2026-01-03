import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, Shield } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || "Failed to sign in");
      setIsLoading(false);
      return;
    }

    // After successful login, the useEffect will handle redirect if user is admin
    toast.success("Signed in successfully. Verifying admin access...");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="animate-fade-in text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-gradient-primary">Admin</span>
            <span className="text-foreground"> Portal</span>
          </h1>
          <p className="text-muted-foreground">Sign in to access the admin panel</p>
        </div>

        <div className="animate-slide-up gradient-card rounded-2xl p-8 shadow-card border border-border/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-secondary/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-secondary/50 border-border focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In as Admin"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Not an admin? <span className="font-semibold text-primary">Sign in here</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access is restricted. Contact the system administrator for access.
        </p>
      </div>
    </div>
  );
};

export default AdminAuth;