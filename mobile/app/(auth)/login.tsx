import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Login failed", error.message);
    } else {
      router.replace("/");
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: COLORS.naturalBg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-12">
          {/* Logo area */}
          <View className="items-center mb-10">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: COLORS.surface }}
            >
              <Text className="text-2xl" style={{ color: COLORS.forest }}>
                🌱
              </Text>
            </View>
            <Text
              className="text-2xl font-semibold"
              style={{ color: COLORS.forest }}
            >
              the tray
            </Text>
            <Text className="text-sm mt-1" style={{ color: COLORS.inkMuted }}>
              Fresh microgreens, delivered
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <TextInput
              className="rounded-xl px-4 py-3.5 text-base mb-3"
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
              autoComplete="email"
            />
            <TextInput
              className="rounded-xl px-4 py-3.5 text-base"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.ink,
                borderWidth: 0.5,
                borderColor: COLORS.border,
              }}
              placeholder="Password"
              placeholderTextColor={COLORS.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {/* Login button */}
          <TouchableOpacity
            className="rounded-xl py-4 items-center mb-4"
            style={{
              backgroundColor: COLORS.forest,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </TouchableOpacity>

          {/* Forgot password */}
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity className="items-center mb-8">
              <Text className="text-sm" style={{ color: COLORS.coral }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Divider */}
          <View className="flex-row items-center mb-8">
            <View
              className="flex-1 h-px"
              style={{ backgroundColor: COLORS.border }}
            />
            <Text className="mx-4 text-xs" style={{ color: COLORS.inkMuted }}>
              OR
            </Text>
            <View
              className="flex-1 h-px"
              style={{ backgroundColor: COLORS.border }}
            />
          </View>

          {/* Sign up */}
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity
              className="rounded-xl py-4 items-center mb-4"
              style={{
                borderWidth: 1,
                borderColor: COLORS.forest,
              }}
            >
              <Text
                className="font-semibold text-base"
                style={{ color: COLORS.forest }}
              >
                Create an account
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Delivery partner */}
          <Link href="/(auth)/delivery-login" asChild>
            <TouchableOpacity className="items-center mt-4">
              <Text className="text-sm" style={{ color: COLORS.inkMuted }}>
                I'm a delivery partner →
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
