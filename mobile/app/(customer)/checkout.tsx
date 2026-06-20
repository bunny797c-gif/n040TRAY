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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import { useCartStore } from "@/stores/cart";
import { useAddresses } from "@/hooks/useAddresses";
import { useAuthStore } from "@/stores/auth";
import { apiFetch } from "@/lib/api";
import { COLORS } from "@/lib/constants";

type Step = "address" | "otp" | "payment";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { data: savedAddresses } = useAddresses();
  const profile = useAuthStore((s) => s.profile);
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);

  // Address form
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

  // OTP
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Referral
  const [referralCode, setReferralCode] = useState("");

  // Pre-fill from saved default address
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
    }
  }, [savedAddresses]);

  async function checkPincode(pin: string) {
    if (!/^\d{6}$/.test(pin)) {
      setPincodeOk(null);
      setPincodeMsg("");
      return;
    }
    try {
      const res = await apiFetch<{ ok: boolean; serviceable: boolean; city?: string; state?: string; message?: string }>(
        `/api/pincode-check?pincode=${pin}`
      );
      if (res.serviceable) {
        setPincodeOk(true);
        setPincodeMsg(`${res.city}, ${res.state}`);
        setAddr((a) => ({ ...a, city: res.city ?? a.city, state: res.state ?? a.state }));
      } else {
        setPincodeOk(false);
        setPincodeMsg(res.message ?? "Not serviceable");
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
    if (otp.length !== 6) {
      Alert.alert("Error", "Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: addr.phone, otp }),
      });
      setStep("payment");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const cartItems = items.map((i) => ({
        name: i.name,
        packLabel: i.pack,
        qty: i.qty,
        price: i.price,
      }));

      const res = await apiFetch<{
        stub?: boolean;
        razorpay_key?: string;
        razorpay_order_id?: string;
        amount?: number;
        order_db_id?: string;
      }>("/api/cart/create-order", {
        method: "POST",
        body: JSON.stringify({ items: cartItems, address: addr }),
      });

      if (res.stub) {
        clearCart();
        Alert.alert("Order placed!", "Your order has been confirmed (test mode).");
        router.replace("/(customer)/(tabs)");
        return;
      }

      if (!res.razorpay_key || !res.razorpay_order_id) {
        throw new Error("Missing Razorpay details");
      }

      const options = {
        description: "The Tray Microgreens",
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

      await apiFetch("/api/cart/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: res.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
          order_db_id: res.order_db_id,
        }),
      });

      clearCart();
      Alert.alert("Payment successful!", "Your order has been confirmed.");
      router.replace("/(customer)/(tabs)");
    } catch (err: any) {
      if (err.code !== "PAYMENT_CANCELLED") {
        Alert.alert("Error", err.message ?? "Payment failed");
      }
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

  // If phone already verified, skip OTP step
  function proceedFromAddress() {
    if (profile?.verified_phone === addr.phone) {
      setStep("payment");
    } else {
      setStep("otp");
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
          </TouchableOpacity>
          <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Checkout</Text>
        </View>

        {/* Step indicators */}
        <View className="flex-row px-5 mb-4">
          {(["address", "otp", "payment"] as Step[]).map((s, i) => (
            <View key={s} className="flex-1 flex-row items-center">
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{
                  backgroundColor: step === s || (i === 0 && step !== "address") || (i <= 1 && step === "payment")
                    ? COLORS.forest
                    : COLORS.surface,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: step === s || (i === 0 && step !== "address") || (i <= 1 && step === "payment")
                      ? COLORS.white
                      : COLORS.inkMuted,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              {i < 2 && (
                <View className="flex-1 h-0.5 mx-1" style={{ backgroundColor: COLORS.border }} />
              )}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {step === "address" && (
            <>
              <Text className="text-base font-semibold mb-3" style={{ color: COLORS.ink }}>
                Delivery address
              </Text>
              {[
                { key: "full_name", label: "Full name", kb: "default" },
                { key: "phone", label: "Phone (10 digits)", kb: "phone-pad", max: 10 },
                { key: "line1", label: "Address line 1", kb: "default" },
                { key: "line2", label: "Landmark (optional)", kb: "default" },
                { key: "pincode", label: "Pincode", kb: "number-pad", max: 6 },
                { key: "city", label: "City", kb: "default" },
                { key: "state", label: "State", kb: "default" },
              ].map((f) => (
                <TextInput
                  key={f.key}
                  className="rounded-xl px-4 py-3 text-sm mb-2"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
                  placeholder={f.label}
                  placeholderTextColor={COLORS.inkMuted}
                  value={(addr as any)[f.key]}
                  onChangeText={(v) => {
                    setAddr((a) => ({ ...a, [f.key]: v }));
                    if (f.key === "pincode") checkPincode(v);
                  }}
                  keyboardType={f.kb as any}
                  maxLength={f.max}
                />
              ))}

              {pincodeOk !== null && (
                <View className="flex-row items-center mb-2 ml-1">
                  <Ionicons
                    name={pincodeOk ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={pincodeOk ? COLORS.statusDeliveredText : COLORS.statusFailedText}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{ color: pincodeOk ? COLORS.statusDeliveredText : COLORS.statusFailedText }}
                  >
                    {pincodeMsg}
                  </Text>
                </View>
              )}

              {/* Referral code */}
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
              <Text className="text-base font-semibold mb-1" style={{ color: COLORS.ink }}>
                Verify phone
              </Text>
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
                  <Text className="text-base font-semibold text-white">
                    {loading ? "Sending..." : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    className="rounded-xl px-4 py-3.5 text-center text-xl mb-4"
                    style={{
                      backgroundColor: COLORS.surface,
                      color: COLORS.ink,
                      borderWidth: 0.5,
                      borderColor: COLORS.border,
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
                    style={{ backgroundColor: COLORS.forest, opacity: loading ? 0.7 : 1 }}
                    onPress={verifyOtp}
                    disabled={loading}
                  >
                    <Text className="text-base font-semibold text-white">
                      {loading ? "Verifying..." : "Verify"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity className="items-center mt-4" onPress={() => setStep("address")}>
                <Text className="text-sm" style={{ color: COLORS.forest }}>← Change phone</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "payment" && (
            <>
              <Text className="text-base font-semibold mb-4" style={{ color: COLORS.ink }}>
                Order summary
              </Text>

              {/* Items */}
              {items.map((item) => (
                <View
                  key={item.cartKey}
                  className="flex-row justify-between py-2"
                  style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border }}
                >
                  <Text className="text-sm flex-1" style={{ color: COLORS.ink }}>
                    {item.name} ({item.pack}) × {item.qty}
                  </Text>
                  <Text className="text-sm font-medium" style={{ color: COLORS.ink }}>
                    {inr(item.price * item.qty)}
                  </Text>
                </View>
              ))}

              {/* Total */}
              <View className="flex-row justify-between mt-3 mb-2">
                <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>Total</Text>
                <Text className="text-base font-semibold" style={{ color: COLORS.forest }}>
                  {inr(totalPrice())}
                </Text>
              </View>

              {/* Address summary */}
              <View className="rounded-xl p-4 mt-4" style={{ backgroundColor: COLORS.surface }}>
                <Text className="text-xs font-medium" style={{ color: COLORS.inkMuted }}>Delivering to</Text>
                <Text className="text-sm font-medium mt-1" style={{ color: COLORS.ink }}>{addr.full_name}</Text>
                <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} — {addr.pincode}
                </Text>
              </View>

              <TouchableOpacity
                className="rounded-xl py-4 items-center mt-6"
                style={{ backgroundColor: COLORS.forest, opacity: loading ? 0.7 : 1 }}
                onPress={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text className="text-base font-semibold text-white">Pay {inr(totalPrice())}</Text>
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
