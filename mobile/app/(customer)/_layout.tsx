import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="checkout" options={{ presentation: "modal" }} />
      <Stack.Screen name="subscription-plans" />
      <Stack.Screen name="subscribe-checkout" />
    </Stack>
  );
}
