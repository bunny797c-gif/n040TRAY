import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth";
import { apiFetch } from "@/lib/api";
import { COLORS } from "@/lib/constants";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ full_name: trimmed }),
      });
      await fetchProfile();
      Alert.alert("Saved", "Your name has been updated");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Profile</Text>
      </View>

      <View className="px-5 mt-6">
        {/* Avatar */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.forest }}
          >
            <Text className="text-2xl font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text className="text-xs mt-2" style={{ color: COLORS.inkMuted }}>
            {profile?.email}
          </Text>
        </View>

        {/* Name field */}
        <Text className="text-xs font-medium mb-1 ml-1" style={{ color: COLORS.inkMuted }}>
          Display name
        </Text>
        <TextInput
          className="rounded-xl px-4 py-3.5 text-base"
          style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
          value={name}
          onChangeText={setName}
          autoComplete="name"
        />

        {/* Phone (read-only) */}
        {profile?.verified_phone && (
          <>
            <Text className="text-xs font-medium mt-4 mb-1 ml-1" style={{ color: COLORS.inkMuted }}>
              Verified phone
            </Text>
            <View
              className="rounded-xl px-4 py-3.5"
              style={{ backgroundColor: COLORS.surface, borderWidth: 0.5, borderColor: COLORS.border }}
            >
              <Text className="text-base" style={{ color: COLORS.inkMuted }}>
                +91 {profile.verified_phone}
              </Text>
            </View>
          </>
        )}

        {/* Wallet */}
        <View className="flex-row items-center mt-6 rounded-xl p-4" style={{ backgroundColor: COLORS.surface }}>
          <Ionicons name="wallet-outline" size={22} color={COLORS.forest} />
          <View className="ml-3">
            <Text className="text-xs" style={{ color: COLORS.inkMuted }}>Tray Coins</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>
              {profile?.wallet_coins ?? 0} coins
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="mt-8 rounded-xl py-4 items-center"
          style={{ backgroundColor: COLORS.forest, opacity: saving ? 0.7 : 1 }}
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-base font-semibold text-white">
            {saving ? "Saving..." : "Save changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
