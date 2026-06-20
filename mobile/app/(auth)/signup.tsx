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
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Signup failed", error.message);
    } else {
      Alert.alert("Success", "Check your email to confirm your account");
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
          <View className="items-center mb-10">
            <Text
              className="text-2xl font-semibold"
              style={{ color: COLORS.forest }}
            >
              Create account
            </Text>
            <Text className="text-sm mt-1" style={{ color: COLORS.inkMuted }}>
              Join The Tray family
            </Text>
          </View>

          <View className="mb-6">
            <TextInput
              className="rounded-xl px-4 py-3.5 text-base mb-3"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.ink,
                borderWidth: 0.5,
                borderColor: COLORS.border,
              }}
              placeholder="Full name"
              placeholderTextColor={COLORS.inkMuted}
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={COLORS.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <TouchableOpacity
            className="rounded-xl py-4 items-center mb-6"
            style={{
              backgroundColor: COLORS.forest,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Creating account..." : "Sign up"}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-sm" style={{ color: COLORS.inkMuted }}>
                Already have an account?{" "}
                <Text style={{ color: COLORS.forest, fontWeight: "600" }}>
                  Sign in
                </Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
