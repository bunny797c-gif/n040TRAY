import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/constants";

export interface Product {
  id: string;
  name: string;
  family: string | null;
  taste: string | null;
  description: string | null;
  benefits: string | null;
  grow_time: string | null;
  daily_intake: string | null;
  tag: string | null;
  tag_class: string | null;
  image_url: string | null;
  price_100g: number | null;
  price_200g: number | null;
  price_500g: number | null;
  show_on_home: boolean;
  home_order: number | null;
  out_of_stock: boolean;
  featured_home: boolean | null;
}

export function isPopular(p: Product): boolean {
  return p.tag?.toLowerCase() === "popular";
}

const PRICE_FALLBACKS = { price_100g: 249, price_200g: 449, price_500g: 999 };

export function packPrice(p: Product, key: "price_100g" | "price_200g" | "price_500g"): number {
  return Number(p?.[key]) || PRICE_FALLBACKS[key];
}

export const PACK_OPTIONS = [
  { label: "100g", priceKey: "price_100g" as const },
  { label: "200g", priceKey: "price_200g" as const },
  { label: "500g", priceKey: "price_500g" as const },
];

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url}`;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("microgreens_catalog")
        .select("*")
        .eq("show_on_home", true)
        .order("home_order")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        image_url: resolveImageUrl(p.image_url),
      })) as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("microgreens_catalog")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return { ...data, image_url: resolveImageUrl(data.image_url) } as Product;
    },
    enabled: !!id,
  });
}
