import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileLogoutButton from "../components/profile/ProfileLogoutButton";
import { sendLocalNotification } from "../notifications";
import { clearAuth } from "../services/api";

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
};

const SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: "Your account",
    items: [
      {
        icon: "person-circle-outline",
        label: "Edit profile",
        subtitle: "Update your profile info",
        onPress: () => router.push("/(dashboard)/profile"),
      },
      {
        icon: "lock-closed-outline",
        label: "Change password",
        subtitle: "Keep your account secure",
      },
    ],
  },
  {
    title: "How you use app",
    items: [
      { icon: "bookmark-outline", label: "Saved" },
      { icon: "time-outline", label: "Your activity" },
      { icon: "notifications-outline", label: "Notifications" },
      {
        icon: "chatbubble-ellipses-outline",
        label: "Messages",
        onPress: () => router.push("/(dashboard)/messages"),
      },
    ],
  },
  {
    title: "Who can see your content",
    items: [
      { icon: "lock-open-outline", label: "Account privacy" },
      { icon: "ban-outline", label: "Blocked" },
      { icon: "help-circle-outline", label: "Help & support" },
    ],
  },
];

const COLORS = {
  page: "#f8fafc",
  card: "#ffffff",
  border: "#e5e7eb",
  heading: "#0f172a",
  text: "#111827",
  subtext: "#6b7280",
  icon: "#4b5563",
  accentBg: "#eef2ff",
  accentText: "#4338ca",
  accentBorder: "#c7d2fe",
};

export default function SettingsActivityScreen() {
  const insets = useSafeAreaInsets();
  const handleLogout = async () => {
    await clearAuth();
    router.replace("/(tabs)");
  };
  const handleSendTestNotification = async () => {
    try {
      await sendLocalNotification();
    } catch {
      Alert.alert("Error", "Failed to send test notification.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.page }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.card,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: COLORS.accentBg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.accentText} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.heading }}>
          Settings and activity
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View
            style={{
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.card,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              gap: 10,
            }}
          >
            <Ionicons name="search-outline" size={20} color={COLORS.subtext} />
            <TextInput
              placeholder="Search"
              placeholderTextColor={COLORS.subtext}
              style={{ flex: 1, fontSize: 18, color: COLORS.text, padding: 0 }}
            />
          </View>
        </View>

        {SECTIONS.map((section, sectionIndex) => (
          <View key={section.title} style={{ marginTop: 20 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: COLORS.heading,
                  marginBottom: 10,
                }}
              >
                {section.title}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: COLORS.card,
                marginHorizontal: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: "hidden",
              }}
            >
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <Ionicons name={item.icon} size={23} color={COLORS.icon} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: COLORS.text,
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text
                        style={{ fontSize: 14, color: COLORS.subtext, marginTop: 2 }}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.subtext}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {sectionIndex < SECTIONS.length - 1 ? (
              <View
                style={{
                  marginTop: 8,
                  borderTopWidth: 0,
                }}
              />
            ) : null}
          </View>
        ))}
        <TouchableOpacity
          onPress={handleSendTestNotification}
          activeOpacity={0.85}
          style={{
            marginTop: 20,
            marginHorizontal: 16,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: COLORS.accentBg,
            borderWidth: 1,
            borderColor: COLORS.accentBorder,
          }}
        >
          <Text style={{ color: COLORS.accentText, fontSize: 16, fontWeight: "700" }}>
            Send Test Notification
          </Text>
        </TouchableOpacity>
        <ProfileLogoutButton onLogout={handleLogout} />
      </ScrollView>
    </View>
  );
}
