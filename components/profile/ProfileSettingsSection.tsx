import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type ProfileSettingsSectionProps = {
  onOpenEditProfile: () => void;
  onOpenChangePassword: () => void;
  onOpenMessages: () => void;
};

const SETTINGS_ITEMS = [
  {
    icon: "person-outline",
    label: "Edit Profile",
    color: "#4f46e5",
    action: "edit" as const,
  },
  {
    icon: "lock-closed-outline",
    label: "Change Password",
    color: "#10b981",
    action: "password" as const,
  },
  {
    icon: "chatbubble-ellipses-outline",
    label: "Messages",
    color: "#0ea5e9",
    action: "messages" as const,
  },
  {
    icon: "notifications-outline",
    label: "Notification Settings",
    color: "#f59e0b",
    action: "notifications" as const,
  },
  {
    icon: "help-circle-outline",
    label: "Help & Support",
    color: "#6b7280",
    action: "help" as const,
  },
];

export default function ProfileSettingsSection({
  onOpenEditProfile,
  onOpenChangePassword,
  onOpenMessages,
}: ProfileSettingsSectionProps) {
  const handlePress = (action: (typeof SETTINGS_ITEMS)[number]["action"]) => {
    if (action === "edit") {
      onOpenEditProfile();
      return;
    }
    if (action === "password") {
      onOpenChangePassword();
      return;
    }
    if (action === "messages") {
      onOpenMessages();
      return;
    }
  };

  return (
    <View
      style={{
        marginTop: 24,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        paddingTop: 20,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: "#111827",
          marginBottom: 8,
        }}
      >
        Settings
      </Text>
      {SETTINGS_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={() => handlePress(item.action)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            gap: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#f3f4f6",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: item.color + "15",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: "500",
              color: "#374151",
            }}
          >
            {item.label}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>
      ))}
    </View>
  );
}
