import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type Role = "customer" | "delivery_partner" | "admin";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  verified_phone: string | null;
  is_admin: boolean;
  role: Role;
  wallet_coins: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role;
  isLoading: boolean;
  isReady: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  role: "customer",
  isLoading: true,
  isReady: false,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });
    if (session) get().fetchProfile();
    else set({ profile: null, role: "customer", isReady: true });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      const role: Role = data.is_admin
        ? "admin"
        : data.role === "delivery_partner"
          ? "delivery_partner"
          : "customer";
      set({ profile: data as Profile, role, isReady: true });
    } else {
      set({ isReady: true });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      profile: null,
      role: "customer",
      isReady: true,
    });
  },
}));
