import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header({
  avatarUrl,
  userName,
  onSearchPress,
  onCreatePress,
}: {
  avatarUrl: string;
  userName: string;
  onSearchPress: () => void;
  onCreatePress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: "#000000",
        paddingTop: insets.top + 6,
        paddingHorizontal: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: brand */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#4f46e5",
            letterSpacing: -0.5,
          }}
        >
          Connect
        </Text>

        {/* Right: action buttons */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onSearchPress}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#111827",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="search-outline" size={20} color="#d1d5db" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCreatePress}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#111827",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color="#d1d5db"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
