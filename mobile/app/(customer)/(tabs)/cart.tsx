import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/stores/cart";
import { COLORS } from "@/lib/constants";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQty, removeItem, clearCart, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
        <View className="px-5 pt-4">
          <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Cart</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="bag-outline" size={56} color={COLORS.border} />
          <Text className="text-base font-semibold mt-4" style={{ color: COLORS.ink }}>
            Your cart is empty
          </Text>
          <Text className="text-sm text-center mt-1" style={{ color: COLORS.inkMuted }}>
            Browse our fresh microgreens and add them to your cart
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-xl px-6 py-3"
            style={{ backgroundColor: COLORS.forest }}
            onPress={() => router.push("/(customer)/(tabs)/shop")}
          >
            <Text className="text-sm font-semibold text-white">Browse shop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>
          Cart ({items.length})
        </Text>
        <TouchableOpacity onPress={clearCart}>
          <Text className="text-sm" style={{ color: COLORS.coral }}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.cartKey}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View
            className="flex-row rounded-xl p-3 mb-3"
            style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} className="w-16 h-16 rounded-lg" resizeMode="cover" />
            ) : (
              <View className="w-16 h-16 rounded-lg items-center justify-center" style={{ backgroundColor: COLORS.surface }}>
                <Text className="text-xl">🌿</Text>
              </View>
            )}
            <View className="flex-1 ml-3 justify-between">
              <View>
                <Text className="text-sm font-semibold" style={{ color: COLORS.ink }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>{item.pack}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold" style={{ color: COLORS.forest }}>
                  {inr(item.price)}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: COLORS.surface }}
                    onPress={() => updateQty(item.cartKey, item.qty - 1)}
                  >
                    <Ionicons name={item.qty === 1 ? "trash-outline" : "remove"} size={14} color={COLORS.ink} />
                  </TouchableOpacity>
                  <Text className="text-sm font-semibold w-5 text-center" style={{ color: COLORS.ink }}>
                    {item.qty}
                  </Text>
                  <TouchableOpacity
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: COLORS.forest }}
                    onPress={() => updateQty(item.cartKey, item.qty + 1)}
                  >
                    <Ionicons name="add" size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Checkout bar */}
      <View
        className="px-5 py-4 flex-row items-center"
        style={{ backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border }}
      >
        <View className="flex-1">
          <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Total</Text>
          <Text className="text-xl font-semibold" style={{ color: COLORS.forest }}>
            {inr(totalPrice())}
          </Text>
        </View>
        <TouchableOpacity
          className="rounded-xl px-8 py-3.5"
          style={{ backgroundColor: COLORS.forest }}
          onPress={() => router.push("/(customer)/checkout")}
        >
          <Text className="text-base font-semibold text-white">Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
