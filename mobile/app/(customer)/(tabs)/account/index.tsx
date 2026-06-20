import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth";
import { useSubscriptions } from "@/hooks/useSubscription";
import { useOrders } from "@/hooks/useOrders";
import { formatDate } from "@/lib/dates";
import { COLORS } from "@/lib/constants";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const menuItems: { icon: IoniconsName; label: string; route: string }[] = [
  { icon: "repeat-outline", label: "Subscription", route: "/(customer)/(tabs)/account/subscription" },
  { icon: "receipt-outline", label: "Orders", route: "/(customer)/(tabs)/account/orders" },
  { icon: "location-outline", label: "Addresses", route: "/(customer)/(tabs)/account/addresses" },
  { icon: "gift-outline", label: "Referral", route: "/(customer)/(tabs)/account/referral" },
  { icon: "person-outline", label: "Profile", route: "/(customer)/(tabs)/account/profile" },
];

export default function AccountScreen() {
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const { data: subs } = useSubscriptions();
  const { data: orders } = useOrders();

  const activeSub = subs?.find((s) => s.status === "active" || s.status === "paused");
  const recentOrder = orders?.[0];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-2">
          <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Account</Text>
        </View>

        {/* Profile card */}
        <View className="mx-5 mt-2 rounded-2xl p-5 flex-row items-center" style={{ backgroundColor: COLORS.surface }}>
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: COLORS.forest }}
          >
            <Text className="text-lg font-semibold text-white">
              {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
              {profile?.full_name ?? "Customer"}
            </Text>
            <Text className="text-xs" style={{ color: COLORS.inkMuted }}>{profile?.email}</Text>
          </View>
          {profile?.wallet_coins ? (
            <View className="items-center">
              <Text className="text-sm font-semibold" style={{ color: COLORS.forest }}>
                {profile.wallet_coins}
              </Text>
              <Text className="text-[9px]" style={{ color: COLORS.inkMuted }}>coins</Text>
            </View>
          ) : null}
        </View>

        {/* Quick stats */}
        {(activeSub || recentOrder) && (
          <View className="flex-row mx-5 mt-3 gap-3">
            {activeSub && (
              <TouchableOpacity
                className="flex-1 rounded-xl p-3"
                style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
                onPress={() => router.push("/(customer)/(tabs)/account/subscription")}
              >
                <Text className="text-[10px]" style={{ color: COLORS.inkMuted }}>Subscription</Text>
                <Text className="text-sm font-semibold mt-0.5" style={{ color: COLORS.forest }}>
                  {activeSub.status === "active" ? "Active" : "Paused"}
                </Text>
                {activeSub.next_delivery_date && (
                  <Text className="text-[10px] mt-0.5" style={{ color: COLORS.inkMuted }}>
                    Next: {formatDate(activeSub.next_delivery_date)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {recentOrder && (
              <TouchableOpacity
                className="flex-1 rounded-xl p-3"
                style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
                onPress={() => router.push("/(customer)/(tabs)/account/orders")}
              >
                <Text className="text-[10px]" style={{ color: COLORS.inkMuted }}>Last order</Text>
                <Text className="text-sm font-semibold mt-0.5" style={{ color: COLORS.forest }}>
                  ₹{recentOrder.amount_inr}
                </Text>
                <Text className="text-[10px] mt-0.5" style={{ color: COLORS.inkMuted }}>
                  {recentOrder.status === "paid" ? "Paid" : recentOrder.status}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu */}
        <View className="mx-5 mt-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              className="flex-row items-center py-4"
              style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border }}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name={item.icon} size={22} color={COLORS.forest} />
              <Text className="flex-1 text-base ml-4" style={{ color: COLORS.ink }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.inkMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="mx-5 mt-8 mb-12 rounded-xl py-3.5 items-center"
          style={{ borderWidth: 1, borderColor: COLORS.coral }}
          onPress={logout}
        >
          <Text className="text-sm font-semibold" style={{ color: COLORS.coral }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
