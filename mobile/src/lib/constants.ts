export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? API_BASE_URL;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const COLORS = {
  forest: "#2D5A3D",
  forestLight: "#3A7050",
  sage: "#8FB996",
  sageLight: "#A8D4AE",
  naturalBg: "#F8FAF5",
  surface: "#EEF3E8",
  border: "#DCE8D4",
  mint: "#F5FAF5",
  warmCream: "#FAF3ED",
  warmSand: "#EDE0D2",
  coral: "#D97757",
  coralLight: "#FDE8DA",
  ink: "#2D3A28",
  inkMuted: "#7A8A72",
  inkSoft: "#5C7A52",
  white: "#FFFFFF",

  statusScheduled: "#EEF3E8",
  statusScheduledText: "#2D5A3D",
  statusInTransit: "#FEF3C7",
  statusInTransitText: "#92400E",
  statusDelivered: "#D1FAE5",
  statusDeliveredText: "#065F46",
  statusFailed: "#FEE2E2",
  statusFailedText: "#991B1B",
} as const;
