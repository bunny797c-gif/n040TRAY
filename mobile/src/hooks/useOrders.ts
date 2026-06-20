import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export interface Order {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount_inr: number;
  status: "created" | "paid" | "failed" | "refunded";
  razorpay_order_id: string | null;
  items: { name: string; pack: string | null; qty: number; price: number }[] | null;
  delivery_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export function useOrders() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: !!userId,
  });
}
