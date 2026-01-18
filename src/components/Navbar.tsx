import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useDealerRole } from "@/hooks/useDealerRole";
import { LogOut, User, ArrowLeft, LayoutDashboard, Shield, Store } from "lucide-react";
import AdminNotificationBell from "./AdminNotificationBell";
import NewCarNotificationBell from "./NewCarNotificationBell";
import PriceAlertNotifications from "./PriceAlertNotifications";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isDealer } = useDealerRole();
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Left: Back + Logo */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Back</span>
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <img src="/carbazaar-logo.png" alt="CARBAZAAR Logo" className="h-8 sm:h-10 w-auto" />
            <span className="text-lg sm:text-xl font-bold tracking-tight hidden xs:inline">
              <span className="text-gradient-primary">CAR</span>
              <span className="text-foreground">BAZAAR</span>
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              {/* Notification bells - compact on mobile */}
              <div className="flex items-center gap-1">
                <PriceAlertNotifications />
                <NewCarNotificationBell />
                {isAdmin && <AdminNotificationBell />}
              </div>
              
              {/* Role-specific buttons */}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-primary">
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline ml-2">Admin</span>
                  </Button>
                </Link>
              )}
              {isDealer && (
                <Link to="/dealer">
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-orange-500">
                    <Store className="w-4 h-4" />
                    <span className="hidden md:inline ml-2">Dealer</span>
                  </Button>
                </Link>
              )}
              
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline ml-2">Dashboard</span>
                </Button>
              </Link>
              
              {/* User email - hide on small screens */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground px-2">
                <User className="w-4 h-4 shrink-0" />
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline ml-2">Sign Out</span>
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