import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, Phone, User, MapPin, ArrowLeft } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().trim().min(10, { message: "Phone number must be at least 10 digits" }).max(15),
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  city: z.string().trim().min(2, { message: "City must be at least 2 characters" }).max(100),
});

const resetSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
});

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "login") {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    } else if (mode === "signup") {
      const validation = signupSchema.safeParse({ email, password, phone, name, city });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    } else if (mode === "forgot") {
      const validation = resetSchema.safeParse({ email });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } else if (mode === "signup") {
      const { error } = await signUp(email, password, phone, name, city);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in.");
        } else {
          toast.error(error.message || "Failed to create account");
        }
      } else {
        toast.success("Account created successfully!");
        navigate("/");
      }
    } else if (mode === "forgot") {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message || "Failed to send reset email");
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setMode("login");
      }
    }

    setIsLoading(false);
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome back to the world of luxury";
      case "signup": return "Join the elite automotive experience";
      case "forgot": return "Reset your password";
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Please wait...";
    switch (mode) {
      case "login": return "Sign In";
      case "signup": return "Create Account";
      case "forgot": return "Send Reset Link";
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="animate-fade-in text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/carbazaar-logo.png" alt="CARBAZAAR Logo" className="h-16 w-auto" />
            <span className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-primary">CAR</span>
              <span className="text-foreground">BAZAAR</span>
            </span>
          </div>
          <p className="text-muted-foreground">{getTitle()}</p>
        </div>

        <div className="animate-slide-up gradient-card rounded-2xl p-8 shadow-card border border-border/50 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11 h-12 bg-secondary/50 border-border focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-secondary/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-11 h-12 bg-secondary/50 border-border focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="pl-11 h-12 bg-secondary/50 border-border focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
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
            )}

            {mode === "forgot" && (
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>
          </form>

          {mode !== "forgot" && (
            <div className="mt-6 text-center space-y-3">
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <span className="font-semibold text-primary">
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </span>
              </button>
              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={() => navigate("/admin-auth")}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin Login
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  onClick={() => navigate("/dealer-auth")}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Dealer Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;