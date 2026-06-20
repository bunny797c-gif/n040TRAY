import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useOrders, type Order } from "@/hooks/useOrders";
import { formatDate } from "@/lib/dates";
import { COLORS } from "@/lib/constants";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  created: { bg: COLORS.surface, text: COLORS.inkMuted, label: "Processing" },
  paid: { bg: COLORS.statusDelivered, text: COLORS.statusDeliveredText, label: "Paid" },
  failed: { bg: COLORS.statusFailed, text: COLORS.statusFailedText, label: "Failed" },
  refunded: { bg: COLORS.statusInTransit, text: COLORS.statusInTransitText, label: "Refunded" },
};

function OrderCard({ order }: { order: Order }) {
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.created;
  const date = order.paid_at || order.created_at;

  return (
    <View
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
          {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
          <Text className="text-[10px] font-semibold" style={{ color: badge.text }}>{badge.label}</Text>
        </View>
      </View>

      {/* Items */}
      {order.items && order.items.length > 0 ? (
        order.items.map((item, i) => (
          <View key={i} className="flex-row justify-between mb-0.5">
            <Text className="text-sm" style={{ color: COLORS.ink }}>
              {item.name} {item.pack ? `(${item.pack})` : ""} × {item.qty}
            </Text>
            <Text className="text-sm" style={{ color: COLORS.inkMuted }}>
              {inr(item.price * item.qty)}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-sm" style={{ color: COLORS.ink }}>Subscription order</Text>
      )}

      <View className="flex-row justify-between mt-2 pt-2" style={{ borderTopWidth: 0.5, borderTopColor: COLORS.border }}>
        <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>Total</Text>
        <Text className="text-sm font-semibold" style={{ color: COLORS.forest }}>{inr(order.amount_inr)}</Text>
      </View>

      {order.delivery_date && (
        <Text className="text-xs mt-1" style={{ color: COLORS.inkMuted }}>
          Delivery: {formatDate(order.delivery_date)}
        </Text>
      )}
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { data: orders, isLoading } = useOrders();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(customer)/(tabs)/account")} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Orders</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.forest} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
          renderItem={({ item }) => <OrderCard order={item} />}
          ListEmptyComponent={
            <View className="items-center mt-12">
              <Text className="text-3xl mb-3">📦</Text>
              <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>No orders yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
