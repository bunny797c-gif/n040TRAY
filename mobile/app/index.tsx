import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { COLORS } from "@/lib/constants";

export default function Index() {
  const router = useRouter();
  const { session, role, isReady } = useAuthStore();

  useEffect(() => {
    if (!isReady) return;

    if (!session) {
      router.replace("/(auth)/login");
      return;
    }

    if (role === "delivery_partner") {
      router.replace("/(delivery)/(tabs)");
    } else {
      router.replace("/(customer)/(tabs)");
    }
  }, [isReady, session, role, router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: COLORS.forest }}
    >
      <ActivityIndicator size="large" color={COLORS.white} />
    </View>
  );
}
