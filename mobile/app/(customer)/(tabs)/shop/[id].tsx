import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProduct, packPrice } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cart";
import { COLORS } from "@/lib/constants";

function inr(n: number | null | undefined) {
  return `₹${(n ?? 0).toLocaleString("en-IN")}`;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);
  const [selectedPack, setSelectedPack] = useState<"100g" | "200g" | "500g">("100g");

  if (isLoading || !product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.naturalBg }}>
        <ActivityIndicator size="large" color={COLORS.forest} />
      </SafeAreaView>
    );
  }

  const priceMap = {
    "100g": packPrice(product, "price_100g"),
    "200g": packPrice(product, "price_200g"),
    "500g": packPrice(product, "price_500g"),
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(customer)/(tabs)/shop")}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>

        {/* Image */}
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} className="w-full h-72" resizeMode="cover" />
        ) : (
          <Image source={require("@/assets/sprouts2.png")} style={{ width: "100%", height: 288 }} resizeMode="cover" />
        )}

        <View className="px-5 pt-5 pb-8">
          {/* Name & tags */}
          <View className="flex-row items-start">
            <Text className="text-2xl font-semibold flex-1" style={{ color: COLORS.ink }}>
              {product.name}
            </Text>
            {product.tag?.toLowerCase() === "popular" && (
              <View className="rounded-full px-2.5 py-1 ml-2 mt-1" style={{ backgroundColor: COLORS.coralLight }}>
                <Text className="text-xs font-medium" style={{ color: COLORS.coral }}>Popular</Text>
              </View>
            )}
          </View>

          {product.family && (
            <Text className="text-sm mt-1" style={{ color: COLORS.inkMuted }}>
              {product.family}
            </Text>
          )}

          {product.taste && (
            <View className="flex-row items-center mt-2">
              <Text className="text-xs" style={{ color: COLORS.inkSoft }}>Taste: </Text>
              <Text className="text-xs font-medium" style={{ color: COLORS.ink }}>{product.taste}</Text>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <Text className="text-sm mt-4 leading-5" style={{ color: COLORS.inkMuted }}>
              {product.description}
            </Text>
          )}

          {/* Benefits */}
          {product.benefits && (
            <View className="mt-4 rounded-xl p-4" style={{ backgroundColor: COLORS.surface }}>
              <Text className="text-sm font-semibold mb-1" style={{ color: COLORS.forest }}>Benefits</Text>
              <Text className="text-sm leading-5" style={{ color: COLORS.inkMuted }}>{product.benefits}</Text>
            </View>
          )}

          {/* Details */}
          <View className="flex-row mt-4 gap-3">
            {product.grow_time && (
              <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: COLORS.surface }}>
                <Text className="text-[10px]" style={{ color: COLORS.inkMuted }}>Grow time</Text>
                <Text className="text-sm font-medium mt-0.5" style={{ color: COLORS.ink }}>{product.grow_time}</Text>
              </View>
            )}
            {product.daily_intake && (
              <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: COLORS.surface }}>
                <Text className="text-[10px]" style={{ color: COLORS.inkMuted }}>Daily intake</Text>
                <Text className="text-sm font-medium mt-0.5" style={{ color: COLORS.ink }}>{product.daily_intake}</Text>
              </View>
            )}
          </View>

          {/* Pack selector */}
          <Text className="text-sm font-semibold mt-6 mb-2" style={{ color: COLORS.ink }}>
            Select pack
          </Text>
          <View className="flex-row gap-3">
            {(["100g", "200g", "500g"] as const).map((pack) => (
              <TouchableOpacity
                key={pack}
                className="flex-1 rounded-xl py-3 items-center"
                style={{
                  backgroundColor: selectedPack === pack ? COLORS.forest : COLORS.surface,
                  borderWidth: selectedPack === pack ? 0 : 0.5,
                  borderColor: COLORS.border,
                }}
                onPress={() => setSelectedPack(pack)}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: selectedPack === pack ? COLORS.white : COLORS.ink }}
                >
                  {pack}
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: selectedPack === pack ? COLORS.sageLight : COLORS.inkMuted }}
                >
                  {inr(priceMap[pack])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View
        className="px-5 py-4 flex-row items-center"
        style={{ backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border }}
      >
        <View className="flex-1">
          <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Price</Text>
          <Text className="text-xl font-semibold" style={{ color: COLORS.forest }}>
            {inr(priceMap[selectedPack])}
          </Text>
        </View>
        <TouchableOpacity
          className="rounded-xl px-8 py-3.5"
          style={{
            backgroundColor: product.out_of_stock ? COLORS.inkMuted : COLORS.forest,
          }}
          disabled={product.out_of_stock}
          onPress={() => {
            addItem({
              name: product.name,
              pack: selectedPack,
              price: priceMap[selectedPack],
              image_url: product.image_url,
            });
            router.canGoBack() ? router.back() : router.replace("/(customer)/(tabs)/shop");
          }}
        >
          <Text className="text-base font-semibold text-white">
            {product.out_of_stock ? "Out of stock" : "Add to cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
