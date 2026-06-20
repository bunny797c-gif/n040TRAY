import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useReferral } from "@/hooks/useReferral";
import { COLORS } from "@/lib/constants";

export default function ReferralScreen() {
  const router = useRouter();
  const { data, isLoading } = useReferral();

  async function shareCode() {
    if (!data?.code) return;
    await Share.share({
      message: `Hey! Use my code ${data.code} to get ₹50 off your first Tray Microgreens order. Fresh microgreens delivered every Sunday! 🌱`,
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
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Referral</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Wallet */}
        <View className="rounded-2xl p-5 mt-4" style={{ backgroundColor: COLORS.forest }}>
          <Text className="text-xs" style={{ color: COLORS.sage }}>Tray Coins</Text>
          <Text className="text-3xl font-bold text-white mt-1">
            {data?.walletCoins ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: COLORS.sageLight }}>
            10 coins = ₹1 discount
          </Text>
        </View>

        {data?.hasReferral && data.code ? (
          <>
            {/* Code card */}
            <View
              className="rounded-2xl p-5 mt-4"
              style={{ backgroundColor: COLORS.warmCream }}
            >
              <Text className="text-sm" style={{ color: COLORS.inkMuted }}>Your referral code</Text>
              <Text className="text-2xl font-bold tracking-widest mt-1" style={{ color: COLORS.ink }}>
                {data.code}
              </Text>
              <Text className="text-xs mt-2" style={{ color: COLORS.inkMuted }}>
                Share with friends — you both earn 500 Tray Coins (₹50)
              </Text>
              <TouchableOpacity
                className="mt-4 rounded-xl py-3 items-center"
                style={{ backgroundColor: COLORS.coral }}
                onPress={shareCode}
              >
                <Text className="text-sm font-semibold text-white">Share code</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mt-4 px-1">
              <View className="items-center">
                <Text className="text-lg font-semibold" style={{ color: COLORS.forest }}>
                  {data.usesCount ?? 0}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Friends joined</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-semibold" style={{ color: COLORS.forest }}>
                  {data.maxUses ?? 0}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Max uses</Text>
              </View>
            </View>

            {/* Reward history */}
            {data.rewards && data.rewards.length > 0 && (
              <View className="mt-6">
                <Text className="text-sm font-semibold mb-3" style={{ color: COLORS.ink }}>
                  Referral history
                </Text>
                {data.rewards.map((r) => (
                  <View
                    key={r.id}
                    className="flex-row items-center justify-between py-3"
                    style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border }}
                  >
                    <View>
                      <Text className="text-sm" style={{ color: COLORS.ink }}>
                        {r.referee?.full_name ?? "Friend"}
                      </Text>
                      <Text className="text-[10px]" style={{ color: COLORS.inkMuted }}>
                        {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold" style={{ color: COLORS.forest }}>
                      +{r.coins_referrer} coins
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View className="items-center mt-12">
            <Text className="text-3xl mb-3">🎁</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
              No referral code yet
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: COLORS.inkMuted }}>
              Complete your first order to unlock your referral code
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
