import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <View
      className="flex-1 px-8 justify-center"
      style={{ backgroundColor: COLORS.naturalBg }}
    >
      <Text
        className="text-2xl font-semibold text-center mb-2"
        style={{ color: COLORS.forest }}
      >
        Reset password
      </Text>
      <Text
        className="text-sm text-center mb-8"
        style={{ color: COLORS.inkMuted }}
      >
        {sent
          ? "Check your email for a reset link"
          : "Enter your email to receive a reset link"}
      </Text>

      {!sent && (
        <>
          <TextInput
            className="rounded-xl px-4 py-3.5 text-base mb-4"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}
            placeholder="Email"
            placeholderTextColor={COLORS.inkMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            className="rounded-xl py-4 items-center mb-4"
            style={{
              backgroundColor: COLORS.forest,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleReset}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Sending..." : "Send reset link"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="items-center">
          <Text className="text-sm" style={{ color: COLORS.forest }}>
            ← Back to sign in
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
