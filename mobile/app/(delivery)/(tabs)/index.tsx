import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { apiFetch } from "@/lib/api";
import { todayIST, formatDate } from "@/lib/dates";
import { COLORS } from "@/lib/constants";

interface AssignedDelivery {
  id: string;
  scheduled_date: string;
  status: "scheduled" | "picked_up" | "in_transit" | "delivered" | "failed";
  picked_up_at: string | null;
  failed_reason: string | null;
  notes: string | null;
  subscription: {
    id: string;
    plans: { name: string };
    addresses: {
      full_name: string;
      phone: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      pincode: string;
    };
  };
  user: { full_name: string; email: string; phone: string };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  scheduled: { bg: COLORS.statusScheduled, text: COLORS.statusScheduledText, label: "Scheduled", icon: "time-outline" },
  picked_up: { bg: COLORS.statusInTransit, text: COLORS.statusInTransitText, label: "Picked up", icon: "cube-outline" },
  in_transit: { bg: COLORS.statusInTransit, text: COLORS.statusInTransitText, label: "In transit", icon: "bicycle-outline" },
  delivered: { bg: COLORS.statusDelivered, text: COLORS.statusDeliveredText, label: "Delivered", icon: "checkmark-circle-outline" },
  failed: { bg: COLORS.statusFailed, text: COLORS.statusFailedText, label: "Failed", icon: "close-circle-outline" },
};

const NEXT_ACTION: Record<string, { status: string; label: string }> = {
  scheduled: { status: "picked_up", label: "Mark Picked Up" },
  picked_up: { status: "in_transit", label: "Start Delivery" },
  in_transit: { status: "delivered", label: "Mark Delivered" },
};

export default function TodayScreen() {
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const today = todayIST();

  const [failModal, setFailModal] = useState<string | null>(null);
  const [failReason, setFailReason] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["assigned-deliveries", today],
    queryFn: () => apiFetch<{ deliveries: AssignedDelivery[] }>(`/api/delivery/assigned?date=${today}`),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { delivery_id: string; new_status: string; failed_reason?: string }) =>
      apiFetch("/api/delivery/update-status", { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assigned-deliveries"] });
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  function handleStatusUpdate(deliveryId: string, newStatus: string) {
    if (newStatus === "failed") {
      setFailModal(deliveryId);
      return;
    }
    const label = newStatus === "delivered" ? "delivered" : newStatus === "picked_up" ? "picked up" : "in transit";
    Alert.alert(`Mark as ${label}?`, "", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => updateMutation.mutate({ delivery_id: deliveryId, new_status: newStatus }) },
    ]);
  }

  function handleFail() {
    if (!failReason.trim()) {
      Alert.alert("Required", "Please enter a reason for failed delivery");
      return;
    }
    updateMutation.mutate(
      { delivery_id: failModal!, new_status: "failed", failed_reason: failReason.trim() },
      { onSuccess: () => { setFailModal(null); setFailReason(""); } }
    );
  }

  const deliveries = data?.deliveries ?? [];
  const pending = deliveries.filter((d) => !["delivered", "failed"].includes(d.status));
  const completed = deliveries.filter((d) => ["delivered", "failed"].includes(d.status));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.mint }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-5 flex-row items-center justify-between" style={{ backgroundColor: COLORS.forest }}>
        <View>
          <Text className="text-sm" style={{ color: COLORS.sage }}>
            {formatDate(today)}
          </Text>
          <Text className="text-xl font-semibold text-white">
            {profile?.full_name ?? "Partner"}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <Text className="text-xs font-medium text-white">
              {pending.length} pending
            </Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.sage} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.forest} />
        </View>
      ) : deliveries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-3xl mb-3">📦</Text>
          <Text className="text-base font-semibold text-center" style={{ color: COLORS.ink }}>
            No deliveries assigned
          </Text>
          <Text className="text-sm text-center mt-1" style={{ color: COLORS.inkMuted }}>
            Your assigned deliveries will appear here on delivery day
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...pending, ...completed]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={COLORS.forest} />}
          ListHeaderComponent={
            pending.length > 0 ? (
              <Text className="text-xs font-semibold mb-2" style={{ color: COLORS.inkMuted }}>
                PENDING ({pending.length})
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.scheduled;
            const nextAction = NEXT_ACTION[item.status];
            const showCompletedHeader = index === pending.length && completed.length > 0;
            const addr = item.subscription?.addresses;

            return (
              <>
                {showCompletedHeader && (
                  <Text className="text-xs font-semibold mt-4 mb-2" style={{ color: COLORS.inkMuted }}>
                    COMPLETED ({completed.length})
                  </Text>
                )}
                <View
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
                >
                  {/* Customer info */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
                        {item.user?.full_name ?? addr?.full_name ?? "Customer"}
                      </Text>
                      <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                        {addr?.phone ?? item.user?.phone}
                      </Text>
                    </View>
                    <View className="rounded-full px-2.5 py-1 flex-row items-center" style={{ backgroundColor: st.bg }}>
                      <Ionicons name={st.icon as any} size={12} color={st.text} />
                      <Text className="text-[10px] font-semibold ml-1" style={{ color: st.text }}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Address */}
                  {addr && (
                    <View className="rounded-lg p-3 mb-3" style={{ backgroundColor: COLORS.surface }}>
                      <Text className="text-xs" style={{ color: COLORS.ink }}>
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                      </Text>
                      <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                        {addr.city}, {addr.state} — {addr.pincode}
                      </Text>
                    </View>
                  )}

                  {/* Plan */}
                  {item.subscription?.plans?.name && (
                    <Text className="text-xs mb-3" style={{ color: COLORS.inkMuted }}>
                      Plan: {item.subscription.plans.name}
                    </Text>
                  )}

                  {/* Failed reason */}
                  {item.status === "failed" && item.failed_reason && (
                    <View className="rounded-lg p-2 mb-2" style={{ backgroundColor: COLORS.statusFailed }}>
                      <Text className="text-xs" style={{ color: COLORS.statusFailedText }}>
                        Reason: {item.failed_reason}
                      </Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  {nextAction && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 rounded-xl py-3 items-center"
                        style={{ backgroundColor: COLORS.forest }}
                        onPress={() => handleStatusUpdate(item.id, nextAction.status)}
                      >
                        <Text className="text-sm font-semibold text-white">{nextAction.label}</Text>
                      </TouchableOpacity>
                      {item.status === "in_transit" && (
                        <TouchableOpacity
                          className="rounded-xl py-3 px-4 items-center"
                          style={{ borderWidth: 1, borderColor: COLORS.statusFailedText }}
                          onPress={() => handleStatusUpdate(item.id, "failed")}
                        >
                          <Text className="text-sm font-semibold" style={{ color: COLORS.statusFailedText }}>Failed</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </>
            );
          }}
        />
      )}

      {/* Failed reason modal */}
      <Modal visible={!!failModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="rounded-t-3xl px-5 pt-6 pb-10" style={{ backgroundColor: COLORS.white }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: COLORS.ink }}>
              Why did delivery fail?
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-sm mb-4"
              style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
              placeholder="e.g., Customer not available, wrong address..."
              placeholderTextColor={COLORS.inkMuted}
              value={failReason}
              onChangeText={setFailReason}
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: COLORS.surface }}
                onPress={() => { setFailModal(null); setFailReason(""); }}
              >
                <Text className="text-sm font-medium" style={{ color: COLORS.ink }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: COLORS.statusFailedText, opacity: updateMutation.isPending ? 0.7 : 1 }}
                onPress={handleFail}
                disabled={updateMutation.isPending}
              >
                <Text className="text-sm font-semibold text-white">
                  {updateMutation.isPending ? "Saving..." : "Mark Failed"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
