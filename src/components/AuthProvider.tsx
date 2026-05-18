"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  departure_city: string | null;
  dietary_preferences: string | null;
  travel_class: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  date_of_birth: string | null;
  gender: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  nationality: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  sovereign_notes: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any; data: Profile | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch the profile from the database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist yet, we can create one as a safety net
        if (error.code === "PGRST116" && user) {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([{ id: userId, email: user.email || "" }])
            .select()
            .single();

          if (!insertError) {
            setProfile(newProfile);
            return;
          }
        }
        console.error("Profile Fetch Error:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to retrieve profile:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // 1. Check active session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Passwordless Email OTP / Magic Link
  const signInWithOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // Google OAuth Login
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      // 1. Tell Supabase to destroy the session locally and on the server
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // 2. Clear local React state
      setUser(null);
      setProfile(null);
      
      // 3. Fallback: forcefully wipe any Supabase storage remnants just in case
      if (typeof window !== "undefined") {
        for (const key in localStorage) {
          if (key.startsWith("sb-")) {
            localStorage.removeItem(key);
          }
        }
      }

      return { error };
    } catch (error: any) {
      // If a network error blocks the signout, force drop the state anyway
      setUser(null);
      setProfile(null);
      return { error };
    }
  };

  // Update profile attributes (Departure city, dietary pref, etc.)
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("User not authenticated"), data: null };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }
      return { error, data };
    } catch (error: any) {
      return { error, data: null };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithOtp,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
