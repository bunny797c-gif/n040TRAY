import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useSubscriptions,
  useSkipDelivery,
  useTogglePause,
  useCancelSubscription,
} from "@/hooks/useSubscription";
import { useDeliveries } from "@/hooks/useDeliveries";
import { isLockWindow, formatDate, formatDateShort } from "@/lib/dates";
import { COLORS } from "@/lib/constants";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: COLORS.statusDelivered, text: COLORS.statusDeliveredText, label: "Active" },
  paused: { bg: COLORS.statusInTransit, text: COLORS.statusInTransitText, label: "Paused" },
  cancelled: { bg: COLORS.statusFailed, text: COLORS.statusFailedText, label: "Cancelled" },
  expired: { bg: COLORS.surface, text: COLORS.inkMuted, label: "Expired" },
  pending_payment: { bg: COLORS.statusInTransit, text: COLORS.statusInTransitText, label: "Pending" },
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { data: subs, isLoading } = useSubscriptions();
  const { data: deliveries } = useDeliveries();
  const skipMutation = useSkipDelivery();
  const pauseMutation = useTogglePause();
  const cancelMutation = useCancelSubscription();
  const locked = isLockWindow();

  function handleSkip(subId: string) {
    if (locked) return Alert.alert("Locked", "Changes are locked Sat–Sun. Try again on Monday.");
    Alert.alert("Skip delivery?", "Your skipped delivery will be added to the end of your schedule.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        onPress: () =>
          skipMutation.mutate(subId, {
            onSuccess: (data) => Alert.alert("Done", data.message),
            onError: (err) => Alert.alert("Error", err.message),
          }),
      },
    ]);
  }

  function handlePauseResume(subId: string, currentStatus: string) {
    if (locked) return Alert.alert("Locked", "Changes are locked Sat–Sun. Try again on Monday.");
    const action = currentStatus === "active" ? "pause" : "resume";
    const msg = action === "pause"
      ? "No deliveries are lost while paused. You can resume anytime Mon–Fri."
      : "Your next delivery will be scheduled for the upcoming Sunday.";
    Alert.alert(`${action === "pause" ? "Pause" : "Resume"} subscription?`, msg, [
      { text: "Cancel", style: "cancel" },
      {
        text: action === "pause" ? "Pause" : "Resume",
        onPress: () =>
          pauseMutation.mutate(
            { subscriptionId: subId, action },
            {
              onSuccess: (data) => Alert.alert("Done", data.message),
              onError: (err) => Alert.alert("Error", err.message),
            }
          ),
      },
    ]);
  }

  function handleCancel(subId: string) {
    if (locked) return Alert.alert("Locked", "Cancellation is locked Sat–Sun. Try again on Monday.");
    Alert.alert("Cancel subscription?", "No further deliveries will be scheduled. You can subscribe again any time.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel subscription",
        style: "destructive",
        onPress: () =>
          cancelMutation.mutate(subId, {
            onSuccess: (data) => Alert.alert("Done", data.message),
            onError: (err) => Alert.alert("Error", err.message),
          }),
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.naturalBg }}>
        <ActivityIndicator size="large" color={COLORS.forest} />
      </SafeAreaView>
    );
  }

  const activeSubs = subs?.filter((s) => !["cancelled", "expired"].includes(s.status)) ?? [];
  const pastSubs = subs?.filter((s) => ["cancelled", "expired"].includes(s.status)) ?? [];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Subscription</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {locked && (
          <View className="rounded-xl p-3 mt-2 mb-4" style={{ backgroundColor: COLORS.statusInTransit }}>
            <Text className="text-xs" style={{ color: COLORS.statusInTransitText }}>
              Changes are locked during the delivery weekend (Sat–Sun). Actions will be available again on Monday.
            </Text>
          </View>
        )}

        {activeSubs.length === 0 && pastSubs.length === 0 && (
          <View className="items-center mt-12">
            <Text className="text-3xl mb-3">📦</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>No subscriptions yet</Text>
            <Text className="text-sm mt-1 text-center" style={{ color: COLORS.inkMuted }}>
              Subscribe to get fresh microgreens delivered every Sunday
            </Text>
          </View>
        )}

        {activeSubs.map((sub) => {
          const st = STATUS_STYLES[sub.status] ?? STATUS_STYLES.active;
          const upcomingDeliveries = deliveries
            ?.filter((d) => d.subscription_id === sub.id && d.status === "scheduled")
            .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
            .slice(0, 4);

          return (
            <View
              key={sub.id}
              className="rounded-2xl p-5 mt-4"
              style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
                  {sub.plans.name}
                </Text>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: st.bg }}>
                  <Text className="text-[10px] font-semibold" style={{ color: st.text }}>{st.label}</Text>
                </View>
              </View>

              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Price</Text>
                <Text className="text-sm font-medium" style={{ color: COLORS.ink }}>{inr(sub.plans.price_inr)}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Deliveries</Text>
                <Text className="text-sm font-medium" style={{ color: COLORS.ink }}>{sub.plans.deliveries} weeks</Text>
              </View>
              {sub.next_delivery_date && (
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Next delivery</Text>
                  <Text className="text-sm font-medium" style={{ color: COLORS.forest }}>
                    {formatDate(sub.next_delivery_date)}
                  </Text>
                </View>
              )}

              {/* Upcoming schedule */}
              {upcomingDeliveries && upcomingDeliveries.length > 0 && (
                <View className="mt-3 pt-3" style={{ borderTopWidth: 0.5, borderTopColor: COLORS.border }}>
                  <Text className="text-xs font-medium mb-2" style={{ color: COLORS.inkMuted }}>
                    Upcoming deliveries
                  </Text>
                  {upcomingDeliveries.map((d, i) => (
                    <View key={d.id} className="flex-row items-center mb-1.5">
                      <View
                        className="w-1.5 h-1.5 rounded-full mr-2"
                        style={{ backgroundColor: i === 0 ? COLORS.coral : COLORS.sage }}
                      />
                      <Text className="text-xs" style={{ color: COLORS.ink }}>
                        {formatDateShort(d.scheduled_date)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              {sub.status === "active" && (
                <View className="flex-row gap-2 mt-4">
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-2.5 items-center"
                    style={{ backgroundColor: COLORS.surface }}
                    onPress={() => handleSkip(sub.id)}
                  >
                    <Text className="text-xs font-semibold" style={{ color: COLORS.forest }}>Skip next</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-2.5 items-center"
                    style={{ backgroundColor: COLORS.surface }}
                    onPress={() => handlePauseResume(sub.id, sub.status)}
                  >
                    <Text className="text-xs font-semibold" style={{ color: COLORS.forest }}>Pause</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-2.5 items-center"
                    style={{ borderWidth: 1, borderColor: COLORS.coral }}
                    onPress={() => handleCancel(sub.id)}
                  >
                    <Text className="text-xs font-semibold" style={{ color: COLORS.coral }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {sub.status === "paused" && (
                <TouchableOpacity
                  className="mt-4 rounded-xl py-3 items-center"
                  style={{ backgroundColor: COLORS.forest }}
                  onPress={() => handlePauseResume(sub.id, sub.status)}
                >
                  <Text className="text-sm font-semibold text-white">Resume subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {pastSubs.length > 0 && (
          <>
            <Text className="text-sm font-semibold mt-6 mb-2" style={{ color: COLORS.inkMuted }}>
              Past subscriptions
            </Text>
            {pastSubs.map((sub) => {
              const st = STATUS_STYLES[sub.status] ?? STATUS_STYLES.expired;
              return (
                <View
                  key={sub.id}
                  className="rounded-xl p-4 mb-2"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium" style={{ color: COLORS.ink }}>
                      {sub.plans.name}
                    </Text>
                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg }}>
                      <Text className="text-[10px] font-medium" style={{ color: st.text }}>{st.label}</Text>
                    </View>
                  </View>
                  <Text className="text-xs mt-1" style={{ color: COLORS.inkMuted }}>
                    Started {formatDate(sub.start_date)}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
