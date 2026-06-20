import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export interface Plan {
  id: string;
  name: string;
  audience: string;
  duration: string;
  price_inr: number;
  deliveries: number;
  serving_label: string | null;
  varieties_label: string | null;
  savings_pct: number | null;
  tag: string | null;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  address_id: string;
  status: "active" | "paused" | "cancelled" | "expired" | "pending_payment";
  start_date: string;
  next_delivery_date: string | null;
  created_at: string;
  plans: Plan;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price_inr");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });
}

export function useSubscriptions() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
    enabled: !!userId,
  });
}

export function useSkipDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      apiFetch<{ ok: boolean; message: string; new_delivery_date: string }>(
        "/api/subscriptions/skip",
        { method: "POST", body: JSON.stringify({ subscription_id: subscriptionId }) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
}

export function useTogglePause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, action }: { subscriptionId: string; action: "pause" | "resume" }) =>
      apiFetch<{ ok: boolean; message: string; new_status: string }>(
        "/api/subscriptions/toggle-pause",
        { method: "POST", body: JSON.stringify({ subscription_id: subscriptionId, action }) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      apiFetch<{ ok: boolean; message: string }>(
        "/api/subscriptions/cancel",
        { method: "POST", body: JSON.stringify({ subscription_id: subscriptionId }) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}
