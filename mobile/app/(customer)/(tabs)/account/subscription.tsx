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
import { isLockWindow, formatDate } from "@/lib/dates";
import { COLORS } from "@/lib/constants";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function daysFromToday(dateStr: string): number {
  const todayIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const todayMidnight = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - todayMidnight.getTime()) / 86400000);
}

function daysLabel(dateStr: string): { text: string; color: string } {
  const d = daysFromToday(dateStr);
  if (d < 0) return { text: `${Math.abs(d)} day${Math.abs(d) !== 1 ? "s" : ""} ago`, color: COLORS.inkMuted };
  if (d === 0) return { text: "Today", color: COLORS.coral };
  if (d === 1) return { text: "Tomorrow", color: COLORS.forest };
  return { text: `In ${d} day${d !== 1 ? "s" : ""}`, color: COLORS.ink };
}

const SUB_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  active:          { bg: "#D1FAE5", text: "#065F46",          label: "Active" },
  paused:          { bg: "#FEF3C7", text: "#92400E",          label: "Paused" },
  cancelled:       { bg: "#FEE2E2", text: "#991B1B",          label: "Cancelled" },
  expired:         { bg: COLORS.surface, text: COLORS.inkMuted, label: "Expired" },
  pending_payment: { bg: "#FEF3C7", text: "#92400E",          label: "Pending" },
};

const DEL_STATUS: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  scheduled:  { bg: COLORS.surface,  text: COLORS.inkMuted,          label: "Upcoming",   icon: "time-outline" },
  picked_up:  { bg: "#FEF3C7",       text: "#92400E",                 label: "Picked up",  icon: "bicycle-outline" },
  in_transit: { bg: "#FEF3C7",       text: "#92400E",                 label: "On the way", icon: "navigate-outline" },
  delivered:  { bg: "#D1FAE5",       text: "#065F46",                 label: "Delivered",  icon: "checkmark-circle-outline" },
  failed:     { bg: "#FEE2E2",       text: "#991B1B",                 label: "Failed",     icon: "close-circle-outline" },
  skipped:    { bg: "#F3F4F6",       text: "#6B7280",                 label: "Skipped",    icon: "remove-circle-outline" },
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { data: subs, isLoading } = useSubscriptions();
  const { data: allDeliveries } = useDeliveries();
  const skipMutation = useSkipDelivery();
  const pauseMutation = useTogglePause();
  const cancelMutation = useCancelSubscription();
  const locked = isLockWindow();

  function handleSkip(subId: string) {
    if (locked) return Alert.alert("Locked", "Changes are locked Sat–Sun. Try again on Monday.");
    Alert.alert("Skip next delivery?", "It'll be added to the end of your schedule — you won't lose any delivery.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        onPress: () =>
          skipMutation.mutate(subId, {
            onSuccess: (data) => Alert.alert("Skipped", data.message),
            onError: (err) => Alert.alert("Error", err.message),
          }),
      },
    ]);
  }

  function handlePauseResume(subId: string, currentStatus: string) {
    if (locked) return Alert.alert("Locked", "Changes are locked Sat–Sun. Try again on Monday.");
    const action = currentStatus === "active" ? "pause" : "resume";
    Alert.alert(
      action === "pause" ? "Pause subscription?" : "Resume subscription?",
      action === "pause"
        ? "No deliveries will be lost. You can resume any time Mon–Fri."
        : "Your next delivery will be the upcoming Sunday.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "pause" ? "Pause" : "Resume",
          onPress: () =>
            pauseMutation.mutate({ subscriptionId: subId, action }, {
              onSuccess: (data) => Alert.alert("Done", data.message),
              onError: (err) => Alert.alert("Error", err.message),
            }),
        },
      ]
    );
  }

  function handleCancel(subId: string) {
    if (locked) return Alert.alert("Locked", "Cancellation is locked Sat–Sun. Try again on Monday.");
    Alert.alert("Cancel subscription?", "No further deliveries will be scheduled. You can subscribe again any time.", [
      { text: "Keep it", style: "cancel" },
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
  const pastSubs   = subs?.filter((s) => ["cancelled", "expired"].includes(s.status)) ?? [];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(customer)/(tabs)/account")} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>My Subscription</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {locked && (
          <View className="rounded-xl p-3 mt-2 mb-2" style={{ backgroundColor: "#FEF3C7" }}>
            <Text className="text-xs" style={{ color: "#92400E" }}>
              Changes are locked during delivery weekend (Sat–Sun). Back on Monday.
            </Text>
          </View>
        )}

        {activeSubs.length === 0 && pastSubs.length === 0 && (
          <View className="items-center mt-16">
            <Text className="text-4xl mb-4">📦</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>No subscriptions yet</Text>
            <Text className="text-sm mt-1 text-center" style={{ color: COLORS.inkMuted }}>
              Subscribe to get fresh microgreens every Sunday
            </Text>
          </View>
        )}

        {activeSubs.map((sub) => {
          const st = SUB_STATUS[sub.status] ?? SUB_STATUS.active;
          const subDeliveries = (allDeliveries ?? [])
            .filter((d) => d.subscription_id === sub.id)
            .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

          return (
            <View key={sub.id} className="mt-4">
              {/* Plan header */}
              <View
                className="rounded-2xl p-5"
                style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold" style={{ color: COLORS.ink }}>{sub.plans.name}</Text>
                    {sub.plans.serving_label && (
                      <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>{sub.plans.serving_label}</Text>
                    )}
                  </View>
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: st.bg }}>
                    <Text className="text-xs font-semibold" style={{ color: st.text }}>{st.label}</Text>
                  </View>
                </View>

                {/* Subscription details grid */}
                <View style={{ borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: 12, gap: 8 }}>
                  <View className="flex-row justify-between">
                    <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Joined</Text>
                    <Text className="text-xs font-medium" style={{ color: COLORS.ink }}>{formatDate(sub.start_date)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Amount paid</Text>
                    <Text className="text-xs font-semibold" style={{ color: COLORS.forest }}>{inr(sub.plans.price_inr)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Plan</Text>
                    <Text className="text-xs font-medium" style={{ color: COLORS.ink }}>
                      {sub.plans.deliveries} weekly deliveries
                    </Text>
                  </View>
                  {sub.next_delivery_date && (
                    <View className="flex-row justify-between">
                      <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Next delivery</Text>
                      <Text className="text-xs font-semibold" style={{ color: COLORS.forest }}>
                        {formatDate(sub.next_delivery_date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Delivery schedule */}
              {subDeliveries.length > 0 && (
                <View
                  className="rounded-2xl p-5 mt-3"
                  style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
                >
                  <Text className="text-sm font-semibold mb-4" style={{ color: COLORS.ink }}>
                    Delivery schedule
                  </Text>

                  {subDeliveries.map((d, i) => {
                    const ds = DEL_STATUS[d.status] ?? DEL_STATUS.scheduled;
                    const { text: dayText, color: dayColor } = daysLabel(d.scheduled_date);
                    const isSkipped = d.status === "skipped";
                    const isPast = daysFromToday(d.scheduled_date) < 0 && d.status !== "scheduled";

                    return (
                      <View key={d.id}>
                        <View className="flex-row items-start">
                          {/* Number + line */}
                          <View className="items-center mr-4" style={{ width: 28 }}>
                            <View
                              className="w-7 h-7 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: d.status === "delivered"
                                  ? "#065F46"
                                  : isSkipped
                                  ? "#F3F4F6"
                                  : d.status === "failed"
                                  ? "#FEE2E2"
                                  : COLORS.forest,
                              }}
                            >
                              {d.status === "delivered" ? (
                                <Ionicons name="checkmark" size={14} color="#fff" />
                              ) : isSkipped ? (
                                <Ionicons name="remove" size={14} color="#9CA3AF" />
                              ) : d.status === "failed" ? (
                                <Ionicons name="close" size={13} color="#991B1B" />
                              ) : (
                                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{i + 1}</Text>
                              )}
                            </View>
                            {i < subDeliveries.length - 1 && (
                              <View
                                style={{
                                  width: 1.5,
                                  height: isSkipped ? 44 : 28,
                                  backgroundColor: isSkipped ? "#E5E7EB" : COLORS.border,
                                  marginTop: 2,
                                  marginBottom: 2,
                                }}
                              />
                            )}
                          </View>

                          {/* Content */}
                          <View className="flex-1 pb-2">
                            <View className="flex-row items-center justify-between">
                              <Text
                                className="text-sm font-medium"
                                style={{
                                  color: isSkipped ? COLORS.inkMuted : COLORS.ink,
                                  textDecorationLine: isSkipped ? "line-through" : "none",
                                }}
                              >
                                {formatDate(d.scheduled_date)}
                              </Text>
                              <View
                                className="rounded-full px-2 py-0.5"
                                style={{ backgroundColor: ds.bg }}
                              >
                                <Text className="text-[10px] font-semibold" style={{ color: ds.text }}>
                                  {ds.label}
                                </Text>
                              </View>
                            </View>

                            <Text className="text-xs mt-0.5" style={{ color: isSkipped ? COLORS.inkMuted : dayColor }}>
                              {isSkipped
                                ? "Skipped — added to end of schedule"
                                : d.status === "delivered" && d.delivered_at
                                ? (() => {
                                    const dt = new Date(d.delivered_at);
                                    const dateStr = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
                                    const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
                                    return `Delivered ${dateStr} at ${timeStr}`;
                                  })()
                                : dayText}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Actions */}
              {sub.status === "active" && (
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-3 items-center"
                    style={{ backgroundColor: COLORS.surface }}
                    onPress={() => handleSkip(sub.id)}
                    disabled={skipMutation.isPending}
                  >
                    <Text className="text-xs font-semibold" style={{ color: COLORS.forest }}>Skip next</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-3 items-center"
                    style={{ backgroundColor: COLORS.surface }}
                    onPress={() => handlePauseResume(sub.id, sub.status)}
                    disabled={pauseMutation.isPending}
                  >
                    <Text className="text-xs font-semibold" style={{ color: COLORS.forest }}>Pause</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-3 items-center"
                    style={{ borderWidth: 1, borderColor: COLORS.coral }}
                    onPress={() => handleCancel(sub.id)}
                    disabled={cancelMutation.isPending}
                  >
                    <Text className="text-xs font-semibold" style={{ color: COLORS.coral }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {sub.status === "paused" && (
                <TouchableOpacity
                  className="mt-3 rounded-xl py-3.5 items-center"
                  style={{ backgroundColor: COLORS.forest }}
                  onPress={() => handlePauseResume(sub.id, sub.status)}
                >
                  <Text className="text-sm font-semibold text-white">Resume subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Past subscriptions */}
        {pastSubs.length > 0 && (
          <>
            <Text className="text-sm font-semibold mt-8 mb-3" style={{ color: COLORS.inkMuted }}>
              Past subscriptions
            </Text>
            {pastSubs.map((sub) => {
              const st = SUB_STATUS[sub.status] ?? SUB_STATUS.expired;
              const subDeliveries = (allDeliveries ?? [])
                .filter((d) => d.subscription_id === sub.id)
                .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
              const delivered = subDeliveries.filter((d) => d.status === "delivered").length;

              return (
                <View
                  key={sub.id}
                  className="rounded-2xl p-4 mb-2"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>{sub.plans.name}</Text>
                    <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: st.bg }}>
                      <Text className="text-[10px] font-semibold" style={{ color: st.text }}>{st.label}</Text>
                    </View>
                  </View>
                  <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                    Joined {formatDate(sub.start_date)} · {inr(sub.plans.price_inr)}
                  </Text>
                  {subDeliveries.length > 0 && (
                    <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>
                      {delivered} of {subDeliveries.length} deliveries completed
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
