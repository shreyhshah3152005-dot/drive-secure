import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, Phone, User, MapPin } from "lucide-react";
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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    } else {
      const validation = signupSchema.safeParse({ email, password, phone, name, city });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } else {
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
    }

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
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/wohcars-logo.png" alt="WOHCARS Logo" className="h-16 w-auto" />
            <span className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-gold">WOH</span>
              <span className="text-foreground">CARS</span>
            </span>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back to the world of luxury" : "Join the elite automotive experience"}
          </p>
        </div>

        <div className="animate-slide-up gradient-card rounded-2xl p-8 shadow-card border border-border/50 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
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

            {!isLogin && (
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
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-semibold text-primary">
                {isLogin ? "Sign Up" : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
