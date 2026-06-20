import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/stores/cart";
import { COLORS } from "@/lib/constants";

export default function CustomerTabsLayout() {
  const cartCount = useCartStore((s) => s.totalCount());

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
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" size={size} color={color} />
          ),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.coral,
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
