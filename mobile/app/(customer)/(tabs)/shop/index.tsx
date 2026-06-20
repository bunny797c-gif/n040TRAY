import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProducts, packPrice, type Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cart";
import { usePlans } from "@/hooks/useSubscription";
import { COLORS } from "@/lib/constants";

function inr(n: number | null | undefined) {
  return `₹${(n ?? 0).toLocaleString("en-IN")}`;
}

function ProductCard({ item }: { item: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedPack, setSelectedPack] = useState<"100g" | "200g" | "500g">("100g");

  const priceMap = {
    "100g": packPrice(item, "price_100g"),
    "200g": packPrice(item, "price_200g"),
    "500g": packPrice(item, "price_500g"),
  };

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

      {item.out_of_stock && (
        <View className="absolute top-2 right-2 rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.statusFailed }}>
          <Text className="text-[9px] font-semibold" style={{ color: COLORS.statusFailedText }}>Out of stock</Text>
        </View>
      )}

      {item.tag?.toLowerCase() === "popular" && !item.out_of_stock && (
        <View className="absolute top-2 right-2 rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.coralLight }}>
          <Text className="text-[9px] font-semibold" style={{ color: COLORS.coral }}>Popular</Text>
        </View>
      )}

      <View className="p-3">
        <Text className="text-sm font-semibold" style={{ color: COLORS.ink }} numberOfLines={1}>
          {item.name}
        </Text>
        {item.taste && (
          <Text className="text-[11px] mt-0.5" style={{ color: COLORS.inkMuted }} numberOfLines={1}>
            {item.taste}
          </Text>
        )}

        {/* Pack selector */}
        <View className="flex-row mt-2 gap-1">
          {(["100g", "200g", "500g"] as const).map((pack) => (
            <TouchableOpacity
              key={pack}
              className="rounded-md px-2 py-1"
              style={{
                backgroundColor: selectedPack === pack ? COLORS.forest : COLORS.surface,
              }}
              onPress={() => setSelectedPack(pack)}
            >
              <Text
                className="text-[10px] font-medium"
                style={{ color: selectedPack === pack ? COLORS.white : COLORS.inkMuted }}
              >
                {pack}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm font-semibold" style={{ color: COLORS.forest }}>
            {inr(priceMap[selectedPack])}
          </Text>
          {!item.out_of_stock && (
            <TouchableOpacity
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.forest }}
              onPress={() =>
                addItem({
                  name: item.name,
                  pack: selectedPack,
                  price: priceMap[selectedPack],
                  image_url: item.image_url,
                })
              }
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ShopScreen() {
  const router = useRouter();
  const { data: products, isLoading } = useProducts();
  const { data: plans } = usePlans();
  const [search, setSearch] = useState("");
  const cartCount = useCartStore((s) => s.totalCount());

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.family?.toLowerCase().includes(q) ||
        p.taste?.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>
            Shop
          </Text>
          {cartCount > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="bag" size={18} color={COLORS.forest} />
              <View
                className="w-5 h-5 rounded-full items-center justify-center ml-1"
                style={{ backgroundColor: COLORS.coral }}
              >
                <Text className="text-[10px] font-bold text-white">{cartCount}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Search */}
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5"
          style={{ backgroundColor: COLORS.surface, borderWidth: 0.5, borderColor: COLORS.border }}
        >
          <Ionicons name="search" size={18} color={COLORS.inkMuted} />
          <TextInput
            className="flex-1 ml-2 text-sm"
            style={{ color: COLORS.ink }}
            placeholder="Search microgreens..."
            placeholderTextColor={COLORS.inkMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.inkMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.forest} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => <ProductCard item={item} />}
          ListHeaderComponent={
            plans && plans.length > 0 ? (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>Subscribe & Save</Text>
                  <TouchableOpacity onPress={() => router.push("/(customer)/subscription-plans")}>
                    <Text className="text-sm font-medium" style={{ color: COLORS.forest }}>View all →</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  className="rounded-2xl p-4 flex-row items-center"
                  style={{ backgroundColor: COLORS.forest }}
                  onPress={() => router.push("/(customer)/subscription-plans")}
                  activeOpacity={0.8}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">Weekly microgreens, delivered</Text>
                    <Text className="text-xs mt-0.5" style={{ color: COLORS.sageLight }}>
                      Plans from ₹{Math.min(...plans.map((p) => p.price_inr)).toLocaleString("en-IN")} · Every Sunday
                    </Text>
                  </View>
                  <View className="rounded-xl px-4 py-2" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
                    <Text className="text-sm font-semibold text-white">Explore</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center mt-12">
              <Text className="text-base" style={{ color: COLORS.inkMuted }}>
                {search ? "No microgreens found" : "No products available"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
