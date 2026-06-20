import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link } from "expo-router";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

export default function DeliveryLoginScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    const cleaned = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      Alert.alert("Error", "Enter a valid 10-digit Indian phone number");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/delivery/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: cleaned }),
      });
      setStep("otp");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      Alert.alert("Error", "Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ email: string; password: string }>(
        "/api/delivery/auth/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({ phone: phone.replace(/\D/g, ""), otp }),
        }
      );
      await supabase.auth.signInWithPassword({
        email: res.email,
        password: res.password,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      className="flex-1 px-8 justify-center"
      style={{ backgroundColor: COLORS.naturalBg }}
    >
      <View className="items-center mb-10">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: COLORS.surface }}
        >
          <Text className="text-2xl">🚚</Text>
        </View>
        <Text
          className="text-2xl font-semibold"
          style={{ color: COLORS.forest }}
        >
          Tray Partner
        </Text>
        <Text className="text-sm mt-1" style={{ color: COLORS.inkMuted }}>
          Sign in with your phone number
        </Text>
      </View>

      {step === "phone" ? (
        <>
          <TextInput
            className="rounded-xl px-4 py-3.5 text-base mb-4"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}
            placeholder="+91 Phone number"
            placeholderTextColor={COLORS.inkMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{
              backgroundColor: COLORS.forest,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={sendOtp}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Sending..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text
            className="text-sm text-center mb-4"
            style={{ color: COLORS.inkMuted }}
          >
            OTP sent to +91 {phone}
          </Text>
          <TextInput
            className="rounded-xl px-4 py-3.5 text-base mb-4 text-center tracking-widest"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              borderWidth: 0.5,
              borderColor: COLORS.border,
              fontSize: 20,
              letterSpacing: 8,
            }}
            placeholder="------"
            placeholderTextColor={COLORS.inkMuted}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{
              backgroundColor: COLORS.forest,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={verifyOtp}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text
        className="text-xs text-center mt-6"
        style={{ color: COLORS.inkMuted }}
      >
        Contact admin if you don't have access
      </Text>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="items-center mt-6">
          <Text className="text-sm" style={{ color: COLORS.forest }}>
            ← I'm a customer
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
