import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlans, type Plan } from "@/hooks/useSubscription";
import { COLORS } from "@/lib/constants";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const AUDIENCE_LABELS: Record<string, string> = {
  single: "For you",
  couple: "For two",
  family: "For family",
};

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { data: plans, isLoading } = usePlans();
  const [audience, setAudience] = useState<string>("single");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const audiences = [...new Set(plans?.map((p) => (p as any).audience).filter(Boolean) ?? [])];
  const filtered = plans?.filter((p) => (p as any).audience === audience) ?? [];

  function handleContinue() {
    if (!selectedPlan) {
      Alert.alert("Select a plan", "Please choose a subscription plan");
      return;
    }
    router.push({
      pathname: "/(customer)/subscribe-checkout",
      params: { plan_id: selectedPlan },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.naturalBg }}>
        <ActivityIndicator size="large" color={COLORS.forest} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <View className="px-5 pt-4 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(customer)/(tabs)")} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Choose a plan</Text>
      </View>

      {/* Audience tabs */}
      {audiences.length > 1 && (
        <View className="flex-row px-5 mb-4 gap-2">
          {audiences.map((a) => (
            <TouchableOpacity
              key={a}
              className="flex-1 rounded-xl py-2.5 items-center"
              style={{
                backgroundColor: audience === a ? COLORS.forest : COLORS.surface,
              }}
              onPress={() => { setAudience(a); setSelectedPlan(null); }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: audience === a ? COLORS.white : COLORS.ink }}
              >
                {AUDIENCE_LABELS[a] ?? a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {filtered.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              className="rounded-2xl p-5 mb-3"
              style={{
                backgroundColor: COLORS.white,
                borderWidth: isSelected ? 2 : 0.5,
                borderColor: isSelected ? COLORS.forest : COLORS.border,
              }}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
                    {plan.name}
                  </Text>
                  {plan.serving_label && (
                    <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>
                      {plan.serving_label}
                    </Text>
                  )}
                </View>
                {plan.tag && (
                  <View
                    className="rounded-full px-2.5 py-1 ml-2"
                    style={{
                      backgroundColor: plan.tag === "BEST VALUE" ? COLORS.coralLight : COLORS.surface,
                    }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{
                        color: plan.tag === "BEST VALUE" ? COLORS.coral : COLORS.forest,
                      }}
                    >
                      {plan.tag}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-baseline mt-3">
                <Text className="text-2xl font-bold" style={{ color: COLORS.forest }}>
                  {inr(plan.price_inr)}
                </Text>
                <Text className="text-xs ml-1" style={{ color: COLORS.inkMuted }}>
                  / {plan.deliveries} deliveries
                </Text>
              </View>

              {plan.savings_pct && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="trending-down-outline" size={14} color={COLORS.statusDeliveredText} />
                  <Text className="text-xs ml-1" style={{ color: COLORS.statusDeliveredText }}>
                    Save {plan.savings_pct}%
                  </Text>
                </View>
              )}

              {plan.varieties_label && (
                <Text className="text-xs mt-2" style={{ color: COLORS.inkMuted }}>
                  {plan.varieties_label}
                </Text>
              )}

              {/* Selection indicator */}
              <View className="absolute top-5 right-5">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{
                    borderWidth: isSelected ? 0 : 1.5,
                    borderColor: COLORS.border,
                    backgroundColor: isSelected ? COLORS.forest : "transparent",
                  }}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4"
        style={{ backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border }}
      >
        <TouchableOpacity
          className="rounded-xl py-4 items-center"
          style={{
            backgroundColor: selectedPlan ? COLORS.forest : COLORS.inkMuted,
          }}
          disabled={!selectedPlan}
          onPress={handleContinue}
        >
          <Text className="text-base font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
