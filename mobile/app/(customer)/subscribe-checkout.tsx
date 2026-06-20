import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import { useAddresses } from "@/hooks/useAddresses";
import { usePlans } from "@/hooks/useSubscription";
import { useAuthStore } from "@/stores/auth";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

type Step = "address" | "otp" | "review";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function SubscribeCheckoutScreen() {
  const router = useRouter();
  const { plan_id } = useLocalSearchParams<{ plan_id: string }>();
  const { data: plans } = usePlans();
  const { data: savedAddresses } = useAddresses();
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const plan = plans?.find((p) => p.id === plan_id);
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);

  const [addr, setAddr] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.verified_phone ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [pincodeOk, setPincodeOk] = useState<boolean | null>(null);
  const [pincodeMsg, setPincodeMsg] = useState("");
  const [localities, setLocalities] = useState<{ id: string; name: string; locality_type: string }[]>([]);
  const [selectedLocality, setSelectedLocality] = useState("");
  const [localityModalOpen, setLocalityModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  // Pre-fill from default saved address — editable, locked once subscribed
  useEffect(() => {
    const def = savedAddresses?.find((a) => a.is_default);
    if (def) {
      setAddr({
        full_name: def.full_name,
        phone: def.phone,
        line1: def.line1,
        line2: def.line2 ?? "",
        city: def.city,
        state: def.state,
        pincode: def.pincode,
      });
      setPincodeOk(true);
      setPincodeMsg(`${def.city}, ${def.state}`);
    }
  }, [savedAddresses]);

  async function checkPincode(pin: string) {
    if (!/^\d{6}$/.test(pin)) { setPincodeOk(null); setPincodeMsg(""); return; }
    try {
      const { data } = await supabase
        .from("serviceable_pincodes")
        .select("pincode, city, state")
        .eq("pincode", pin)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setPincodeOk(true);
        setPincodeMsg(`${data.city}, ${data.state}`);
        setAddr((a) => ({ ...a, city: data.city, state: data.state }));
        const { data: locs } = await supabase
          .from("serviceable_localities")
          .select("id, name, locality_type")
          .eq("pincode", pin)
          .eq("is_active", true)
          .order("name");
        setLocalities(locs || []);
        setSelectedLocality("");
      } else {
        setPincodeOk(false);
        setPincodeMsg("We don't deliver here yet — launching soon!");
        setLocalities([]);
      }
    } catch {
      setPincodeOk(false);
      setPincodeMsg("Could not check pincode");
    }
  }

  async function sendOtp() {
    if (!/^[6-9]\d{9}$/.test(addr.phone)) {
      Alert.alert("Error", "Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; devOtp?: string }>("/api/phone/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: addr.phone }),
      });
      setOtpSent(true);
      if (res.devOtp) setOtp(res.devOtp);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) { Alert.alert("Error", "Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      await apiFetch("/api/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: addr.phone, otp }),
      });
      await fetchProfile();
      setStep("review");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  function canProceedToOtp() {
    return (
      addr.full_name.trim().length > 0 &&
      /^[6-9]\d{9}$/.test(addr.phone) &&
      addr.line1.trim().length > 0 &&
      addr.city.trim().length > 0 &&
      addr.state.trim().length > 0 &&
      /^\d{6}$/.test(addr.pincode) &&
      pincodeOk === true
    );
  }

  function proceedFromAddress() {
    if (profile?.verified_phone === addr.phone) {
      setStep("review");
    } else {
      setStep("otp");
    }
  }

  async function handlePayment() {
    if (!plan_id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        stub?: boolean;
        message?: string;
        razorpay_key?: string;
        razorpay_order_id?: string;
        amount?: number;
        order_db_id?: string;
        subscription_id?: string;
        discount_inr?: number;
      }>("/api/checkout/create-order", {
        method: "POST",
        body: JSON.stringify({
          plan_id,
          address: addr,
          referral_code: referralCode.trim() || undefined,
        }),
      });

      if (res.stub) {
        Alert.alert("Subscribed!", res.message ?? "Your subscription is now active.");
        router.replace("/(customer)/(tabs)");
        return;
      }

      if (!res.razorpay_key || !res.razorpay_order_id) throw new Error("Missing payment details");

      const options = {
        description: `The Tray — ${plan?.name ?? "Subscription"}`,
        currency: "INR",
        key: res.razorpay_key,
        amount: res.amount!,
        order_id: res.razorpay_order_id,
        prefill: {
          email: profile?.email ?? "",
          contact: addr.phone,
          name: addr.full_name,
        },
        theme: { color: COLORS.forest },
      };

      const payment = await RazorpayCheckout.open(options);

      await apiFetch("/api/checkout/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: res.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
          order_db_id: res.order_db_id,
          subscription_id: res.subscription_id,
        }),
      });

      Alert.alert("Payment successful!", "Your subscription is now active.");
      router.replace("/(customer)/(tabs)");
    } catch (err: any) {
      if (err.code !== "PAYMENT_CANCELLED") {
        Alert.alert("Error", err.message ?? "Payment failed");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.naturalBg }}>
        <ActivityIndicator size="large" color={COLORS.forest} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(customer)/subscription-plans")} className="mr-3">
            <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
          </TouchableOpacity>
          <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Subscribe</Text>
        </View>

        {/* Step indicators */}
        <View className="flex-row px-5 mb-4">
          {(["address", "otp", "review"] as Step[]).map((s, i) => (
            <View key={s} className="flex-1 flex-row items-center">
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    step === s || (i === 0 && step !== "address") || (i <= 1 && step === "review")
                      ? COLORS.forest
                      : COLORS.surface,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color:
                      step === s || (i === 0 && step !== "address") || (i <= 1 && step === "review")
                        ? COLORS.white
                        : COLORS.inkMuted,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              {i < 2 && <View className="flex-1 h-0.5 mx-1" style={{ backgroundColor: COLORS.border }} />}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Plan summary always visible */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.surface }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>{plan.name}</Text>
              <Text className="text-base font-bold" style={{ color: COLORS.forest }}>{inr(plan.price_inr)}</Text>
            </View>
            <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>
              {plan.deliveries} weekly deliveries{plan.serving_label ? ` · ${plan.serving_label}` : ""}
            </Text>
          </View>

          {step === "address" && (
            <>
              <Text className="text-base font-semibold mb-3" style={{ color: COLORS.ink }}>
                Delivery address
              </Text>

              {/* Contact */}
              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-2"
                style={{ backgroundColor: COLORS.white, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Full name"
                placeholderTextColor={COLORS.inkMuted}
                value={addr.full_name}
                onChangeText={(v) => setAddr((a) => ({ ...a, full_name: v }))}
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-2"
                style={{ backgroundColor: COLORS.white, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Phone (10 digits)"
                placeholderTextColor={COLORS.inkMuted}
                value={addr.phone}
                onChangeText={(v) => setAddr((a) => ({ ...a, phone: v }))}
                keyboardType="phone-pad"
                maxLength={10}
              />

              {/* Pincode first */}
              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-2"
                style={{ backgroundColor: COLORS.white, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Pincode"
                placeholderTextColor={COLORS.inkMuted}
                value={addr.pincode}
                onChangeText={(v) => { setAddr((a) => ({ ...a, pincode: v })); checkPincode(v); }}
                keyboardType="number-pad"
                maxLength={6}
              />

              {pincodeOk !== null && (
                <View className="flex-row items-center mb-2 ml-1">
                  <Ionicons
                    name={pincodeOk ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={pincodeOk ? COLORS.statusDeliveredText : COLORS.statusFailedText}
                  />
                  <Text className="text-xs ml-1" style={{ color: pincodeOk ? COLORS.statusDeliveredText : COLORS.statusFailedText }}>
                    {pincodeMsg}
                  </Text>
                </View>
              )}

              {/* Locality dropdown */}
              {pincodeOk && localities.length > 0 && (
                <View className="mb-2">
                  <TouchableOpacity
                    className="rounded-xl px-4 py-3 flex-row items-center justify-between"
                    style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: selectedLocality ? COLORS.forest : COLORS.border }}
                    onPress={() => setLocalityModalOpen(true)}
                  >
                    <Text className="text-sm" style={{ color: selectedLocality ? COLORS.ink : COLORS.inkMuted, fontWeight: selectedLocality ? "600" : "400" }}>
                      {selectedLocality || "Select your locality / area"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.inkMuted} />
                  </TouchableOpacity>

                  <Modal visible={localityModalOpen} transparent animationType="slide">
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => setLocalityModalOpen(false)}
                      style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
                    >
                      <View onStartShouldSetResponder={() => true} style={{ backgroundColor: COLORS.naturalBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingBottom: 30 }}>
                        <View className="flex-row items-center justify-between px-5 pt-4 pb-3" style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border }}>
                          <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>Select locality</Text>
                          <TouchableOpacity onPress={() => setLocalityModalOpen(false)}>
                            <Ionicons name="close" size={22} color={COLORS.inkMuted} />
                          </TouchableOpacity>
                        </View>
                        <FlatList
                          data={localities}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              className="px-5 py-3.5 flex-row items-center justify-between"
                              style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border, backgroundColor: selectedLocality === item.name ? "#f0f7eb" : "transparent" }}
                              onPress={() => {
                                setSelectedLocality(item.name);
                                setAddr((a) => ({ ...a, line2: item.name }));
                                setLocalityModalOpen(false);
                              }}
                            >
                              <View>
                                <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>{item.name}</Text>
                                <Text className="text-[10px] mt-0.5" style={{ color: COLORS.inkMuted, textTransform: "uppercase" }}>{item.locality_type}</Text>
                              </View>
                              {selectedLocality === item.name && <Ionicons name="checkmark-circle" size={20} color={COLORS.forest} />}
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
              )}

              {/* Street / address */}
              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-2"
                style={{ backgroundColor: COLORS.white, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Street / area name"
                placeholderTextColor={COLORS.inkMuted}
                value={addr.line1}
                onChangeText={(v) => setAddr((a) => ({ ...a, line1: v }))}
              />

              {/* Door number (optional) */}
              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-2"
                style={{ backgroundColor: COLORS.white, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Door / flat number (optional)"
                placeholderTextColor={COLORS.inkMuted}
                value={addr.line2}
                onChangeText={(v) => setAddr((a) => ({ ...a, line2: v }))}
              />

              {/* City & State auto-filled */}
              <View className="flex-row gap-2 mb-2">
                <TextInput
                  className="rounded-xl px-4 py-3 text-sm flex-1"
                  style={{ backgroundColor: COLORS.white, color: pincodeOk ? COLORS.inkMuted : COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                  placeholder="City"
                  placeholderTextColor={COLORS.inkMuted}
                  value={addr.city}
                  onChangeText={(v) => setAddr((a) => ({ ...a, city: v }))}
                  editable={!pincodeOk}
                />
                <TextInput
                  className="rounded-xl px-4 py-3 text-sm flex-1"
                  style={{ backgroundColor: COLORS.white, color: pincodeOk ? COLORS.inkMuted : COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                  placeholder="State"
                  placeholderTextColor={COLORS.inkMuted}
                  value={addr.state}
                  onChangeText={(v) => setAddr((a) => ({ ...a, state: v }))}
                  editable={!pincodeOk}
                />
              </View>

              <TextInput
                className="rounded-xl px-4 py-3 text-sm mb-4 mt-2"
                style={{ backgroundColor: COLORS.warmCream, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                placeholder="Referral code (optional)"
                placeholderTextColor={COLORS.inkMuted}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                className="rounded-xl py-4 items-center"
                style={{ backgroundColor: canProceedToOtp() ? COLORS.forest : COLORS.inkMuted }}
                disabled={!canProceedToOtp()}
                onPress={proceedFromAddress}
              >
                <Text className="text-base font-semibold text-white">Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "otp" && (
            <>
              <Text className="text-base font-semibold mb-1" style={{ color: COLORS.ink }}>Verify phone</Text>
              <Text className="text-sm mb-4" style={{ color: COLORS.inkMuted }}>
                We'll send an OTP to +91 {addr.phone}
              </Text>

              {!otpSent ? (
                <TouchableOpacity
                  className="rounded-xl py-4 items-center"
                  style={{ backgroundColor: COLORS.coral, opacity: loading ? 0.7 : 1 }}
                  onPress={sendOtp}
                  disabled={loading}
                >
                  <Text className="text-base font-semibold text-white">{loading ? "Sending..." : "Send OTP"}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    className="rounded-xl px-4 py-3.5 text-center text-xl mb-4"
                    style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border, letterSpacing: 8 }}
                    placeholder="------"
                    placeholderTextColor={COLORS.inkMuted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    className="rounded-xl py-4 items-center"
                    style={{ backgroundColor: COLORS.forest, opacity: loading ? 0.7 : 1 }}
                    onPress={verifyOtp}
                    disabled={loading}
                  >
                    <Text className="text-base font-semibold text-white">{loading ? "Verifying..." : "Verify"}</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity className="items-center mt-4" onPress={() => setStep("address")}>
                <Text className="text-sm" style={{ color: COLORS.forest }}>← Change phone</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "review" && (
            <>
              <Text className="text-base font-semibold mb-3" style={{ color: COLORS.ink }}>Confirm & pay</Text>

              <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.border }}>
                <Text className="text-xs font-medium" style={{ color: COLORS.inkMuted }}>Delivering to</Text>
                <Text className="text-sm font-medium mt-1" style={{ color: COLORS.ink }}>{addr.full_name}</Text>
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                  +91 {addr.phone}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} — {addr.pincode}
                </Text>
              </View>

              {referralCode.trim() && (
                <View className="flex-row items-center rounded-xl p-3 mb-3" style={{ backgroundColor: COLORS.warmCream }}>
                  <Ionicons name="gift-outline" size={16} color={COLORS.coral} />
                  <Text className="text-xs ml-2" style={{ color: COLORS.ink }}>
                    Referral code: <Text className="font-semibold">{referralCode.toUpperCase()}</Text>
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="rounded-xl py-4 items-center"
                style={{ backgroundColor: COLORS.forest, opacity: loading ? 0.7 : 1 }}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text className="text-base font-semibold text-white">Pay {inr(plan.price_inr)}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity className="items-center mt-4" onPress={() => setStep("address")}>
                <Text className="text-sm" style={{ color: COLORS.forest }}>← Edit address</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
