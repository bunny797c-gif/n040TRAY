import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts, packPrice, type Product } from "@/hooks/useProducts";
import { useSubscriptions, usePlans } from "@/hooks/useSubscription";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { COLORS } from "@/lib/constants";
import { nextSundayIST, formatDate, formatDateShort } from "@/lib/dates";

function inr(n: number | null | undefined) {
  return `₹${(n ?? 0).toLocaleString("en-IN")}`;
}

function ProductCard({ item, onAdd }: { item: Product; onAdd: () => void }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="rounded-2xl mb-4 overflow-hidden"
      style={{
        backgroundColor: COLORS.white,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        width: "48%",
      }}
      activeOpacity={0.7}
      onPress={() => router.push(`/(customer)/(tabs)/shop/${item.id}`)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} className="w-full h-28" resizeMode="cover" />
      ) : (
        <Image source={require("@/assets/sprouts2.png")} style={{ width: "100%", height: 112 }} resizeMode="cover" />
      )}
      <View className="p-3">
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold flex-1" style={{ color: COLORS.ink }} numberOfLines={1}>
            {item.name}
          </Text>
          {item.tag?.toLowerCase() === "popular" && (
            <View className="rounded-full px-1.5 py-0.5 ml-1" style={{ backgroundColor: COLORS.coralLight }}>
              <Text className="text-[9px] font-medium" style={{ color: COLORS.coral }}>Popular</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-xs" style={{ color: COLORS.inkMuted }}>From {inr(packPrice(item, "price_100g"))}</Text>
          {!item.out_of_stock && (
            <TouchableOpacity
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.forest }}
              onPress={onAdd}
            >
              <Ionicons name="add" size={14} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const addItem = useCartStore((s) => s.addItem);
  const { data: products, isLoading } = useProducts();
  const { data: subs } = useSubscriptions();
  const { data: plans } = usePlans();
  const { data: deliveries } = useDeliveries();

  const featured = products?.filter((p) => p.show_on_home || p.featured_home).slice(0, 6)
    ?? products?.slice(0, 6) ?? [];

  const activeSub = subs?.find((s) => s.status === "active");
  const nextDelivery = activeSub?.next_delivery_date ?? nextSundayIST();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Find today or tomorrow's delivery
  const todayIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const todayStr = todayIST.toISOString().slice(0, 10);
  const tomorrowIST = new Date(todayIST);
  tomorrowIST.setDate(tomorrowIST.getDate() + 1);
  const tomorrowStr = tomorrowIST.toISOString().slice(0, 10);

  const imminent = deliveries?.find(
    (d) => d.scheduled_date === todayStr || d.scheduled_date === tomorrowStr
  );
  const imminentLabel = imminent?.scheduled_date === todayStr ? "Today" : "Tomorrow";

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    scheduled:  { label: "Scheduled",   color: COLORS.forest,            bg: COLORS.surface },
    picked_up:  { label: "Picked up",   color: "#92400E",                bg: "#FEF3C7" },
    in_transit: { label: "On the way",  color: "#92400E",                bg: "#FEF3C7" },
    delivered:  { label: "Delivered ✓", color: "#065F46",                bg: "#D1FAE5" },
    failed:     { label: "Failed",      color: COLORS.statusFailedText,  bg: "#FEE2E2" },
    skipped:    { label: "Skipped",     color: COLORS.inkMuted,          bg: COLORS.surface },
  };

  async function onRefresh() {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.forest} />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm" style={{ color: COLORS.inkMuted }}>Hello, {firstName}</Text>
            <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>the tray 🌱</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.surface }}
            onPress={() => router.push("/(customer)/(tabs)/account")}
          >
            <Ionicons name="person-outline" size={20} color={COLORS.forest} />
          </TouchableOpacity>
        </View>

        {/* Active subscription card */}
        {activeSub ? (
          <View className="mx-5 mt-4 rounded-2xl p-5" style={{ backgroundColor: COLORS.forest }}>
            {/* Imminent delivery (today / tomorrow) */}
            {imminent && (
              <View className="mb-4 pb-4" style={{ borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.15)" }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS.coral }} />
                    <Text className="text-xs font-medium uppercase" style={{ color: COLORS.sageLight }}>
                      {imminentLabel}'s delivery
                    </Text>
                  </View>
                  {(() => {
                    const s = STATUS_MAP[imminent.status] ?? STATUS_MAP.scheduled;
                    return (
                      <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: s.bg }}>
                        <Text className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</Text>
                      </View>
                    );
                  })()}
                </View>
                <Text className="text-base font-semibold text-white mt-1">
                  {formatDate(imminent.scheduled_date)}
                </Text>
                {imminent.status === "delivered" && imminent.delivered_at && (
                  <Text className="text-xs mt-0.5" style={{ color: COLORS.sageLight }}>
                    {(() => {
                      const dt = new Date(imminent.delivered_at);
                      const dateStr = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
                      const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
                      return `Delivered ${dateStr} at ${timeStr}`;
                    })()}
                  </Text>
                )}
              </View>
            )}

            {/* Next upcoming delivery */}
            <View className="flex-row items-center mb-1">
              <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: imminent ? "rgba(255,255,255,0.4)" : COLORS.coral }} />
              <Text className="text-xs font-medium uppercase" style={{ color: COLORS.sageLight }}>Next delivery</Text>
            </View>
            <Text className="text-lg font-semibold text-white">{formatDate(nextDelivery)}</Text>
            <Text className="text-xs mt-1" style={{ color: COLORS.sage }}>
              {activeSub.plans.name} — {activeSub.plans.deliveries} deliveries
            </Text>
            <TouchableOpacity
              className="self-start mt-3 rounded-lg px-3 py-1.5"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              onPress={() => router.push("/(customer)/(tabs)/account/subscription")}
            >
              <Text className="text-xs font-medium text-white">Manage →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-5 mt-4 rounded-2xl p-5" style={{ backgroundColor: COLORS.forest }}>
            <View className="flex-row items-center mb-2">
              <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS.coral }} />
              <Text className="text-xs font-medium" style={{ color: COLORS.sageLight }}>DELIVERIES EVERY SUNDAY</Text>
            </View>
            <Text className="text-lg font-semibold text-white">Next: {formatDate(nextDelivery)}</Text>
            <Text className="text-xs mt-1" style={{ color: COLORS.sage }}>
              Fresh microgreens delivered to your door
            </Text>
          </View>
        )}


        {/* Featured microgreens */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: COLORS.ink }}>Fresh picks</Text>
            <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/shop")}>
              <Text className="text-sm font-medium" style={{ color: COLORS.forest }}>View all →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={COLORS.forest} />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {featured.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={() => addItem({ name: item.name, pack: "100g", price: packPrice(item, "price_100g"), image_url: item.image_url })}
                />
              ))}
            </View>
          )}
        </View>

        {/* Subscription Plans */}
        {plans && plans.length > 0 && (
          <View className="mt-6 px-5">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-semibold" style={{ color: COLORS.ink }}>Subscription plans</Text>
                {activeSub && (
                  <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Add a new plan for next month</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => router.push("/(customer)/subscription-plans")}>
                <Text className="text-sm font-medium" style={{ color: COLORS.forest }}>See all →</Text>
              </TouchableOpacity>
            </View>
            {plans.slice(0, 3).map((plan) => (
              <TouchableOpacity
                key={plan.id}
                className="rounded-2xl p-4 mb-3 flex-row items-center"
                style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
                onPress={() => router.push("/(customer)/subscription-plans")}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>{plan.name}</Text>
                    {plan.tag && (
                      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.coralLight }}>
                        <Text className="text-[9px] font-semibold" style={{ color: COLORS.coral }}>{plan.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>
                    {plan.deliveries} deliveries{plan.serving_label ? ` · ${plan.serving_label}` : ""}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold" style={{ color: COLORS.forest }}>₹{plan.price_inr.toLocaleString("en-IN")}</Text>
                  {plan.savings_pct && (
                    <Text className="text-[10px]" style={{ color: COLORS.statusDeliveredText }}>Save {plan.savings_pct}%</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.inkMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Referral banner */}
        <View className="mx-5 mt-2 mb-8 rounded-2xl p-5" style={{ backgroundColor: COLORS.surface }}>
          <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>Refer a friend 🎁</Text>
          <Text className="text-xs mt-1 mb-3" style={{ color: COLORS.inkMuted }}>
            Share The Tray with friends and earn Tray Coins on every referral
          </Text>
          <TouchableOpacity
            className="self-start rounded-xl px-4 py-2"
            style={{ backgroundColor: COLORS.coral }}
            onPress={() => router.push("/(customer)/(tabs)/account/referral")}
          >
            <Text className="text-sm font-semibold text-white">Share now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
