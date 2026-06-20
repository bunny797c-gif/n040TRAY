import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  type Address,
} from "@/hooks/useAddresses";
import { COLORS } from "@/lib/constants";

function AddressForm({
  initial,
  onSubmit,
  loading,
  onCancel,
}: {
  initial?: Partial<Address>;
  onSubmit: (data: any) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
  });

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const fields: { key: string; label: string; kb?: any; max?: number }[] = [
    { key: "full_name", label: "Full name" },
    { key: "phone", label: "Phone (10 digits)", kb: "phone-pad", max: 10 },
    { key: "line1", label: "Address line 1" },
    { key: "line2", label: "Address line 2 (optional)" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode", kb: "number-pad", max: 6 },
  ];

  return (
    <View className="mt-4">
      {fields.map((f) => (
        <TextInput
          key={f.key}
          className="rounded-xl px-4 py-3 text-sm mb-2"
          style={{ backgroundColor: COLORS.surface, color: COLORS.ink, borderWidth: 0.5, borderColor: COLORS.border }}
          placeholder={f.label}
          placeholderTextColor={COLORS.inkMuted}
          value={(form as any)[f.key]}
          onChangeText={(v) => update(f.key, v)}
          keyboardType={f.kb ?? "default"}
          maxLength={f.max}
        />
      ))}
      <View className="flex-row gap-3 mt-2">
        <TouchableOpacity className="flex-1 rounded-xl py-3 items-center" style={{ backgroundColor: COLORS.surface }} onPress={onCancel}>
          <Text className="text-sm font-medium" style={{ color: COLORS.ink }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 rounded-xl py-3 items-center"
          style={{ backgroundColor: COLORS.forest, opacity: loading ? 0.7 : 1 }}
          onPress={() => onSubmit(form)}
          disabled={loading}
        >
          <Text className="text-sm font-semibold text-white">{loading ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AddressesScreen() {
  const router = useRouter();
  const { data: addresses, isLoading } = useAddresses();
  const createMut = useCreateAddress();
  const updateMut = useUpdateAddress();
  const deleteMut = useDeleteAddress();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleCreate(data: any) {
    createMut.mutate(
      { ...data, is_default: (addresses?.length ?? 0) === 0 },
      {
        onSuccess: () => setShowForm(false),
        onError: (err) => Alert.alert("Error", err.message),
      }
    );
  }

  function handleSetDefault(id: string) {
    updateMut.mutate({ id, set_default: true });
  }

  function handleDelete(id: string) {
    Alert.alert("Delete address?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMut.mutate(id, { onError: (err) => Alert.alert("Error", err.message) }),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.naturalBg }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(customer)/(tabs)/account")} className="mr-3">
              <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
            </TouchableOpacity>
            <Text className="text-xl font-semibold" style={{ color: COLORS.ink }}>Addresses</Text>
          </View>
          {!showForm && (
            <TouchableOpacity onPress={() => { setEditingId(null); setShowForm(true); }}>
              <Ionicons name="add-circle-outline" size={26} color={COLORS.forest} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {isLoading && (
            <View className="items-center mt-12">
              <ActivityIndicator size="large" color={COLORS.forest} />
            </View>
          )}

          {showForm && (
            <AddressForm
              initial={editingId ? addresses?.find((a) => a.id === editingId) : undefined}
              onSubmit={handleCreate}
              loading={createMut.isPending}
              onCancel={() => setShowForm(false)}
            />
          )}

          {addresses?.map((addr) => (
            <View
              key={addr.id}
              className="rounded-xl p-4 mt-3"
              style={{ backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: addr.is_default ? COLORS.forest : COLORS.border }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold" style={{ color: COLORS.ink }}>{addr.full_name}</Text>
                {addr.is_default && (
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.statusDelivered }}>
                    <Text className="text-[10px] font-medium" style={{ color: COLORS.statusDeliveredText }}>Default</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs" style={{ color: COLORS.inkMuted }}>{addr.phone}</Text>
              <Text className="text-xs mt-1" style={{ color: COLORS.inkMuted }}>
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
              </Text>
              <Text className="text-xs" style={{ color: COLORS.inkMuted }}>
                {addr.city}, {addr.state} — {addr.pincode}
              </Text>
              <View className="flex-row gap-4 mt-3">
                {!addr.is_default && (
                  <TouchableOpacity onPress={() => handleSetDefault(addr.id)}>
                    <Text className="text-xs font-medium" style={{ color: COLORS.forest }}>Set default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(addr.id)}>
                  <Text className="text-xs font-medium" style={{ color: COLORS.coral }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!isLoading && (!addresses || addresses.length === 0) && !showForm && (
            <View className="items-center mt-12">
              <Text className="text-3xl mb-3">📍</Text>
              <Text className="text-base font-semibold" style={{ color: COLORS.ink }}>No addresses yet</Text>
              <Text className="text-sm mt-1" style={{ color: COLORS.inkMuted }}>
                Add a delivery address to get started
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
