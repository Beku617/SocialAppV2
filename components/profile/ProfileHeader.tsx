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
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "800", color: "#f9fafb" }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
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
