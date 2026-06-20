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
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

type Step = "pincode" | "locality" | "account";

interface Locality {
  id: string;
  name: string;
  locality_type: string;
}

export default function SignupScreen() {
  const [step, setStep] = useState<Step>("pincode");
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "checking" | "ok" | "unsupported">("idle");
  const [pincodeCity, setPincodeCity] = useState("");

  const [localities, setLocalities] = useState<Locality[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [localitySearch, setLocalitySearch] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkPincode(pin: string) {
    setPincode(pin);
    if (!/^\d{6}$/.test(pin)) {
      setPincodeStatus("idle");
      return;
    }
    setPincodeStatus("checking");
    try {
      const { data } = await supabase
        .from("serviceable_pincodes")
        .select("pincode, city, state")
        .eq("pincode", pin)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setPincodeStatus("ok");
        setPincodeCity(`${data.city}, ${data.state}`);
        const { data: locs } = await supabase
          .from("serviceable_localities")
          .select("id, name, locality_type")
          .eq("pincode", pin)
          .eq("is_active", true)
          .order("name");
        setLocalities(locs || []);
      } else {
        setPincodeStatus("unsupported");
        setLocalities([]);
      }
    } catch {
      setPincodeStatus("unsupported");
    }
  }

  function proceedFromPincode() {
    if (localities.length > 0) {
      setStep("locality");
    } else {
      setStep("account");
    }
  }

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
            <Text className="text-2xl font-semibold" style={{ color: COLORS.forest }}>
              {step === "pincode" ? "Check delivery" : "Create account"}
            </Text>
            <Text className="text-sm mt-1" style={{ color: COLORS.inkMuted }}>
              {step === "pincode" ? "We'll check if we deliver to you" : "Join The Tray family"}
            </Text>
          </View>

          {step === "pincode" && (
            <>
              <TextInput
                className="rounded-xl px-4 py-4 text-base text-center mb-3"
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.ink,
                  borderWidth: pincodeStatus === "ok" ? 2 : 0.5,
                  borderColor: pincodeStatus === "ok" ? COLORS.forest : pincodeStatus === "unsupported" ? COLORS.statusFailedText : COLORS.border,
                  fontSize: 22,
                  letterSpacing: 6,
                  fontWeight: "700",
                }}
                placeholder="_ _ _ _ _ _"
                placeholderTextColor={COLORS.inkMuted}
                value={pincode}
                onChangeText={checkPincode}
                keyboardType="number-pad"
                maxLength={6}
              />

              {pincodeStatus === "checking" && (
                <View className="flex-row items-center justify-center mb-4">
                  <ActivityIndicator size="small" color={COLORS.forest} />
                  <Text className="text-sm ml-2" style={{ color: COLORS.inkMuted }}>Checking...</Text>
                </View>
              )}

              {pincodeStatus === "ok" && (
                <View className="rounded-xl p-4 mb-4 items-center" style={{ backgroundColor: "#D1FAE5" }}>
                  <Ionicons name="checkmark-circle" size={28} color="#065F46" />
                  <Text className="text-base font-semibold mt-2" style={{ color: "#065F46" }}>
                    We deliver to {pincodeCity}!
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: "#065F46" }}>
                    Fresh microgreens every Sunday
                  </Text>
                </View>
              )}

              {pincodeStatus === "unsupported" && (
                <View className="rounded-xl p-5 mb-4 items-center" style={{ backgroundColor: COLORS.warmCream }}>
                  <Text style={{ fontSize: 32 }}>🌱</Text>
                  <Text className="text-base font-semibold mt-2" style={{ color: COLORS.ink }}>
                    Not here yet
                  </Text>
                  <Text className="text-sm text-center mt-1" style={{ color: COLORS.inkMuted }}>
                    We're expanding soon!{"\n"}We'll notify you when we reach {pincode}.
                  </Text>
                </View>
              )}

              {pincodeStatus === "ok" && (
                <TouchableOpacity
                  className="rounded-xl py-4 items-center mb-6"
                  style={{ backgroundColor: COLORS.forest }}
                  onPress={proceedFromPincode}
                >
                  <Text className="text-white font-semibold text-base">Continue →</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {step === "locality" && (
            <>
              <Text className="text-base font-semibold mb-1" style={{ color: COLORS.ink }}>
                Select your locality
              </Text>
              <Text className="text-sm mb-3" style={{ color: COLORS.inkMuted }}>
                {pincodeCity} — {pincode}
              </Text>

              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-3"
                style={{ backgroundColor: COLORS.white, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Search locality..."
                placeholderTextColor={COLORS.inkMuted}
                value={localitySearch}
                onChangeText={setLocalitySearch}
              />

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {localities
                  .filter((l) => l.name.toLowerCase().includes(localitySearch.toLowerCase()))
                  .map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      className="rounded-xl px-4 py-3 mb-2 flex-row items-center"
                      style={{
                        backgroundColor: selectedLocality?.id === loc.id ? COLORS.forest : COLORS.white,
                        borderWidth: 0.5,
                        borderColor: selectedLocality?.id === loc.id ? COLORS.forest : COLORS.border,
                      }}
                      onPress={() => setSelectedLocality(loc)}
                    >
                      <Text
                        className="text-sm font-medium flex-1"
                        style={{ color: selectedLocality?.id === loc.id ? COLORS.white : COLORS.ink }}
                      >
                        {loc.name}
                      </Text>
                      <Text
                        className="text-[10px]"
                        style={{ color: selectedLocality?.id === loc.id ? COLORS.sageLight : COLORS.inkMuted, textTransform: "uppercase" }}
                      >
                        {loc.locality_type}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <TouchableOpacity
                className="rounded-xl py-4 items-center mt-3 mb-4"
                style={{ backgroundColor: selectedLocality ? COLORS.forest : COLORS.inkMuted }}
                disabled={!selectedLocality}
                onPress={() => setStep("account")}
              >
                <Text className="text-white font-semibold text-base">Continue →</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center" onPress={() => { setStep("pincode"); setSelectedLocality(null); }}>
                <Text className="text-sm" style={{ color: COLORS.forest }}>← Change pincode</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "account" && (
            <>
              <View className="flex-row items-center rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: COLORS.surface }}>
                <Ionicons name="location" size={14} color={COLORS.forest} />
                <Text className="text-xs ml-2 flex-1" style={{ color: COLORS.inkMuted }}>
                  Delivering to <Text style={{ color: COLORS.ink, fontWeight: "600" }}>{selectedLocality ? `${selectedLocality.name}, ` : ""}{pincodeCity} — {pincode}</Text>
                </Text>
                <TouchableOpacity className="ml-2" onPress={() => setStep("pincode")}>
                  <Text className="text-xs" style={{ color: COLORS.forest }}>Change</Text>
                </TouchableOpacity>
              </View>

              <View className="mb-6">
                <TextInput
                  className="rounded-xl px-4 py-3.5 text-base mb-3"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                  placeholder="Full name"
                  placeholderTextColor={COLORS.inkMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                />
                <TextInput
                  className="rounded-xl px-4 py-3.5 text-base mb-3"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
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
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
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
                style={{ backgroundColor: COLORS.forest, opacity: loading ? 0.7 : 1 }}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-base">
                  {loading ? "Creating account..." : "Sign up"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-sm" style={{ color: COLORS.inkMuted }}>
                Already have an account?{" "}
                <Text style={{ color: COLORS.forest, fontWeight: "600" }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
