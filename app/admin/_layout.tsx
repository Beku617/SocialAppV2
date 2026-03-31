import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getValidToken, resolveSessionUser } from "../../services/api";

export default function AdminLayout() {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      const token = await getValidToken();
      if (!mounted) return;

      if (!token) {
        router.replace("/(tabs)");
        return;
      }

      const sessionUser = await resolveSessionUser();
      if (!mounted) return;

      if (sessionUser?.role !== "admin") {
        setStatus("denied");
        return;
      }

      setStatus("allowed");
    };

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (status === "denied") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 28,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#111827",
            textAlign: "center",
          }}
        >
          Access denied
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontSize: 15,
            color: "#6b7280",
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Admin access is required for this area.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(dashboard)")}
          style={{
            marginTop: 24,
            backgroundColor: "#111827",
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "600" }}>
            Back to home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
