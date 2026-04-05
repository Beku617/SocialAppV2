import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../services/api";

const iconByType = (type: string) => {
  switch (type) {
    case "post_like":
      return { icon: "heart", iconColor: "#fb7185", iconBg: "#4c0519" };
    case "post_comment":
      return { icon: "chatbubble-ellipses", iconColor: "#60a5fa", iconBg: "#1e3a8a" };
    case "reel_like":
      return { icon: "heart", iconColor: "#fb7185", iconBg: "#4c0519" };
    case "reel_comment":
      return { icon: "chatbubble-ellipses", iconColor: "#60a5fa", iconBg: "#1e3a8a" };
    default:
      return { icon: "notifications", iconColor: "#818cf8", iconBg: "#312e81" };
  }
};

const formatTimeAgo = (dateStr: string) => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

function NotificationCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const iconMeta = iconByType(notification.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        backgroundColor: notification.read ? "#0b1220" : "#111827",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: notification.read ? "#1f2937" : "#374151",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: iconMeta.iconBg,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 14,
        }}
      >
        <Ionicons
          name={iconMeta.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={iconMeta.iconColor}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#f9fafb",
              flex: 1,
              marginRight: 8,
            }}
          >
            {notification.title}
          </Text>
          {!notification.read && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#4f46e5",
                marginTop: 6,
              }}
            />
          )}
        </View>
        <Text
          style={{
            fontSize: 13,
            color: "#9ca3af",
            lineHeight: 18,
            marginTop: 3,
          }}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const result = await fetchNotifications();
    if (result.data) {
      setNotifications(result.data);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const unreadNotifications = notifications.filter((item) => !item.read);
  const readNotifications = notifications.filter((item) => item.read);

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead();
    if (!result.data) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
    }

    if (
      notification.type === "post_like" ||
      notification.type === "post_comment" ||
      notification.type === "reel_like" ||
      notification.type === "reel_comment"
    ) {
      router.push("/(dashboard)/profile");
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#1f2937",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
          Notifications
        </Text>
        <TouchableOpacity
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#111827",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#d1d5db" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[
          ...(unreadNotifications.length > 0
            ? [{ id: "h-new", type: "header", title: "New" } as const]
            : []),
          ...unreadNotifications,
          ...(readNotifications.length > 0
            ? [{ id: "h-earlier", type: "header", title: "Earlier" } as const]
            : []),
          ...readNotifications,
        ]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 70 }}>
            <Ionicons name="notifications-outline" size={42} color="#6b7280" />
            <Text
              style={{ color: "#9ca3af", marginTop: 10, fontSize: 14, fontWeight: "600" }}
            >
              No notifications yet
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if ("type" in item && item.type === "header") {
            return (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#ffffff",
                  }}
                >
                  {item.title}
                </Text>
                {item.title === "New" && unreadNotifications.length > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#818cf8",
                        fontWeight: "600",
                      }}
                    >
                      Mark all as read
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          return (
            <NotificationCard
              notification={item as AppNotification}
              onPress={() => handleOpenNotification(item as AppNotification)}
            />
          );
        }}
      />
    </View>
  );
}
