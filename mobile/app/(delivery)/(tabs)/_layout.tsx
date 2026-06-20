import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";

export default function DeliveryTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.forest,
        tabBarInactiveTintColor: COLORS.inkMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
