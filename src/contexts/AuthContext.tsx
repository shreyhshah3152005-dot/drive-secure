import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, phone?: string, name?: string, city?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Idle timeout in ms
const REMEMBER_ME_KEY = "cb_remember_me";
const LAST_ACTIVITY_KEY = "cb_last_activity";
const IDLE_TIMEOUT_REMEMBERED = 1000 * 60 * 60 * 24 * 30; // 30 days
const IDLE_TIMEOUT_SHORT = 1000 * 60 * 30; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

  const doSignOut = useCallback(async (reason?: string) => {
    await supabase.auth.signOut();
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (reason) toast.info(reason);
  }, []);

  const getIdleLimit = () => {
    return localStorage.getItem(REMEMBER_ME_KEY) === "true"
      ? IDLE_TIMEOUT_REMEMBERED
      : IDLE_TIMEOUT_SHORT;
  };

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    idleTimerRef.current = window.setTimeout(() => {
      doSignOut("You've been signed out due to inactivity.");
    }, getIdleLimit());
  }, [doSignOut]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        if (newSession) resetIdleTimer();
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession) {
        // Check if session expired due to inactivity
        const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
        const limit = getIdleLimit();
        if (lastActivity && Date.now() - lastActivity > limit) {
          doSignOut("Session expired. Please sign in again.");
          setLoading(false);
          return;
        }
        resetIdleTimer();
      }
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    // Track user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    const handleActivity = () => {
      if (supabase.auth.getSession) resetIdleTimer();
    };
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      subscription.unsubscribe();
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer, doSignOut]);

  const signIn = async (email: string, password: string, rememberMe = false) => {
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) resetIdleTimer();
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, phone?: string, name?: string, city?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          phone: phone || null,
          name: name || null,
          city: city || null,
        }
      }
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await doSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
