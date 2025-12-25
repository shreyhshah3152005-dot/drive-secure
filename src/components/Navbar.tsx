import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { LogOut, User, ArrowLeft, LayoutDashboard, Shield } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <img src="/wohcars-logo.png" alt="WOHCARS Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gradient-gold">WOH</span>
              <span className="text-foreground">CARS</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2 text-primary">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
