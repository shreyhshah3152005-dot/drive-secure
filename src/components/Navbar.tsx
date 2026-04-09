import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useDealerRole } from "@/hooks/useDealerRole";
import { useServiceProviderRole } from "@/hooks/useServiceProviderRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { LogOut, User, ArrowLeft, LayoutDashboard, Shield, Store, Bell, Menu, MessageCircle, Wrench } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isDealer } = useDealerRole();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const showBackButton = location.pathname !== "/";
  const [sheetOpen, setSheetOpen] = useState(false);
  const { unreadCount: chatUnread } = useChatNotifications();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setProfileImageUrl(null); return; }
    supabase.from("profiles").select("profile_image_url, name").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setProfileImageUrl(data.profile_image_url); });
  }, [user]);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => {
    const handleClick = () => { if (mobile) setSheetOpen(false); };
    const btnClass = mobile ? "w-full justify-start h-11 text-base" : "h-8 w-8 sm:h-9 sm:w-auto sm:px-3";
    
    return (
      <>
        <Link to="/notifications" onClick={handleClick}>
          <Button variant="ghost" className={`${btnClass} relative`}>
            <Bell className="w-4 h-4" />
            {chatUnread > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] sm:right-0">
                {chatUnread > 9 ? "9+" : chatUnread}
              </Badge>
            )}
            {mobile && <span className="ml-2">Notifications {chatUnread > 0 ? `(${chatUnread})` : ""}</span>}
            {!mobile && <span className="hidden md:inline ml-2">Alerts</span>}
          </Button>
        </Link>

        {isAdmin && (
          <Link to="/admin" onClick={handleClick}>
            <Button variant="ghost" className={`${btnClass} text-primary`}>
              <Shield className="w-4 h-4" />
              {(mobile || !isMobile) && <span className={mobile ? "ml-2" : "hidden md:inline ml-2"}>Admin</span>}
            </Button>
          </Link>
        )}

        {isDealer && (
          <Link to="/dealer" onClick={handleClick}>
            <Button variant="ghost" className={`${btnClass} text-primary`}>
              <Store className="w-4 h-4" />
              {(mobile || !isMobile) && <span className={mobile ? "ml-2" : "hidden md:inline ml-2"}>Dealer</span>}
            </Button>
          </Link>
        )}

        <Link to="/dashboard" onClick={handleClick}>
          <Button variant="ghost" className={btnClass}>
            <LayoutDashboard className="w-4 h-4" />
            {(mobile || !isMobile) && <span className={mobile ? "ml-2" : "hidden md:inline ml-2"}>Dashboard</span>}
          </Button>
        </Link>

        <Link to="/profile" onClick={handleClick}>
          <Button variant="ghost" className={mobile ? btnClass : "h-8 w-8 sm:h-9 sm:w-9 p-0"}>
            {mobile ? (
              <>
                <User className="w-4 h-4" />
                <span className="ml-2">Profile</span>
              </>
            ) : (
              <Avatar className="h-7 w-7 border-2 border-primary/30 hover:border-primary transition-colors">
                {profileImageUrl ? <AvatarImage src={profileImageUrl} alt="Profile" /> : null}
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{userInitial}</AvatarFallback>
              </Avatar>
            )}
          </Button>
        </Link>

        <Button variant="ghost" className={btnClass} onClick={() => { signOut(); handleClick(); }}>
          <LogOut className="w-4 h-4" />
          {(mobile || !isMobile) && <span className={mobile ? "ml-2" : "hidden md:inline ml-2"}>Sign Out</span>}
        </Button>
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Left: Back + Logo */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
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
          <ThemeToggle />
          {user ? (
            <>
              {/* Desktop nav */}
              {!isMobile && (
                <div className="flex items-center gap-1">
                  <NavItems />
                </div>
              )}

              {/* Mobile hamburger */}
              {isMobile && (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 bg-background">
                    <SheetHeader>
                      <SheetTitle className="text-left text-foreground">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-1 mt-6">
                      <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-secondary/30">
                        <Avatar className="h-10 w-10 border-2 border-primary/30">
                          {profileImageUrl ? <AvatarImage src={profileImageUrl} alt="Profile" /> : null}
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <NavItems mobile />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
