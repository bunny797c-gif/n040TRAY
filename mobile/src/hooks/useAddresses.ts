import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await apiFetch<{ addresses: Address[] }>("/api/addresses");
      return res.addresses;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addr: Omit<Address, "id" | "user_id" | "created_at">) =>
      apiFetch<{ address: Address }>("/api/addresses", {
        method: "POST",
        body: JSON.stringify(addr),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (update: { id: string; set_default?: boolean } & Partial<Omit<Address, "id" | "user_id" | "created_at">>) =>
      apiFetch("/api/addresses", {
        method: "PATCH",
        body: JSON.stringify(update),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/addresses", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
