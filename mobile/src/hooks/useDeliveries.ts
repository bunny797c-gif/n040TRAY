import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export interface Delivery {
  id: string;
  subscription_id: string;
  user_id: string;
  scheduled_date: string;
  status: "scheduled" | "picked_up" | "in_transit" | "delivered" | "failed" | "skipped";
  delivered_at: string | null;
  varieties: string[] | null;
  notes: string | null;
  created_at: string;
}

export function useDeliveries() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["deliveries", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("user_id", userId!)
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Delivery[];
    },
    enabled: !!userId,
  });
}
