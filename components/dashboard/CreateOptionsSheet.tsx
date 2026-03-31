import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreateOption = {
  key: "post" | "story" | "reel" | "live";
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OPTIONS: CreateOption[] = [
  { key: "post", label: "Post", icon: "create-outline" },
  { key: "story", label: "Story", icon: "book-outline" },
  { key: "reel", label: "Reel", icon: "film-outline" },
  { key: "live", label: "Live", icon: "videocam-outline" },
];

export default function CreateOptionsSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (key: CreateOption["key"]) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(17, 24, 39, 0.28)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 10,
            paddingHorizontal: 18,
            paddingBottom: Math.max(insets.bottom, 14),
          }}
        >
          <View
            style={{
              width: 56,
              height: 6,
              borderRadius: 999,
              backgroundColor: "#9ca3af",
              alignSelf: "center",
              marginBottom: 14,
            }}
          />

          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => onSelect(option.key)}
              activeOpacity={0.84}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                paddingVertical: 14,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: "#eef2f7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={option.icon} size={27} color="#111827" />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}
