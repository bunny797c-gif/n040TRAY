import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ReferralData {
  hasReferral: boolean;
  code?: string;
  isActive?: boolean;
  usesCount?: number;
  maxUses?: number;
  walletCoins?: number;
  rewards?: {
    id: string;
    coins_referrer: number;
    created_at: string;
    referee: { full_name: string; email: string } | null;
  }[];
}

export function useReferral() {
  return useQuery({
    queryKey: ["referral"],
    queryFn: () => apiFetch<ReferralData>("/api/referral"),
  });
}
