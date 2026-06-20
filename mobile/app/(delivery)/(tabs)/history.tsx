import { View, Text, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { COLORS } from "@/lib/constants";

interface HistoryDelivery {
  id: string;
  scheduled_date: string;
  status: "delivered" | "failed";
  delivered_at: string | null;
  picked_up_at: string | null;
  failed_reason: string | null;
  user: { full_name: string; phone: string };
  subscription: { plans: { name: string }; addresses: { line1: string; city: string; pincode: string } };
}

export default function HistoryScreen() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["delivery-history"],
    queryFn: ({ pageParam = 1 }) =>
      apiFetch<{ deliveries: HistoryDelivery[]; total: number; page: number; limit: number }>(
        `/api/delivery/history?page=${pageParam}&limit=20`
      ),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const deliveries = data?.pages.flatMap((p) => p.deliveries) ?? [];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.mint }}>
      <View className="px-5 pt-4 pb-5" style={{ backgroundColor: COLORS.forest }}>
        <Text className="text-xl font-semibold text-white">History</Text>
        {data?.pages[0] && (
          <Text className="text-xs mt-0.5" style={{ color: COLORS.sage }}>
            {data.pages[0].total} total deliveries
          </Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.forest} />
        </View>
      ) : deliveries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-3xl mb-3">📋</Text>
          <Text className="text-base font-semibold text-center" style={{ color: COLORS.ink }}>
            No delivery history
          </Text>
          <Text className="text-sm text-center mt-1" style={{ color: COLORS.inkMuted }}>
            Your completed deliveries will show up here
          </Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={COLORS.forest} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={COLORS.forest} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => {
            const isDelivered = item.status === "delivered";

            return (
              <View
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {item.user?.full_name ?? "Customer"}
                  </Text>
                  <View
                    className="rounded-full px-2 py-0.5 flex-row items-center"
                    style={{ backgroundColor: isDelivered ? COLORS.statusDelivered : COLORS.statusFailed }}
                  >
                    <Ionicons
                      name={isDelivered ? "checkmark-circle-outline" : "close-circle-outline"}
                      size={12}
                      color={isDelivered ? COLORS.statusDeliveredText : COLORS.statusFailedText}
                    />
                    <Text
                      className="text-[10px] font-semibold ml-1"
                      style={{ color: isDelivered ? COLORS.statusDeliveredText : COLORS.statusFailedText }}
                    >
                      {isDelivered ? "Delivered" : "Failed"}
                    </Text>
                  </View>
                </View>

                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                  {formatDate(item.scheduled_date)}
                </Text>

                {item.subscription?.addresses && (
                  <Text className="text-xs mt-1" style={{ color: COLORS.inkMuted }}>
                    {item.subscription.addresses.line1}, {item.subscription.addresses.city} — {item.subscription.addresses.pincode}
                  </Text>
                )}

                {item.failed_reason && (
                  <View className="rounded-lg p-2 mt-2" style={{ backgroundColor: COLORS.statusFailed }}>
                    <Text className="text-xs" style={{ color: COLORS.statusFailedText }}>
                      {item.failed_reason}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
