import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type ProfileHeaderProps = {
  title: string;
  topInset: number;
  onOpenSettings: () => void;
};

export default function ProfileHeader({
  title,
  topInset,
  onOpenSettings,
}: ProfileHeaderProps) {
  return (
    <View
      style={{
        paddingTop: topInset + 6,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#111827",
        backgroundColor: "#000000",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ width: 38, height: 38 }} />

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#f9fafb" }}>
          {title}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#f9fafb" />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#ff3040",
            marginTop: 2,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 8, width: 38, justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={onOpenSettings}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#111827",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="menu-outline" size={22} color="#d1d5db" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
