import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function AdminPostEditBlockedScreen() {
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
          fontSize: 28,
          fontWeight: "700",
          color: "#111827",
          textAlign: "center",
        }}
      >
        Editing posts is not allowed
      </Text>
      <Text
        style={{
          marginTop: 12,
          fontSize: 15,
          color: "#6b7280",
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        Admin post management supports create, view, and delete only.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/admin" as any)}
        style={{
          marginTop: 24,
          backgroundColor: "#111827",
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>
          Back to admin dashboard
        </Text>
      </TouchableOpacity>
    </View>
  );
}
