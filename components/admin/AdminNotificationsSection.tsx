import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  fetchAdminUsers,
  sendAdminNotification,
  type AdminUser,
} from "../../services/api";
import AdminConfirmDialog, { type AdminDialogTone } from "./AdminConfirmDialog";

type NoticeDialogState = {
  tone: AdminDialogTone;
  title: string;
  message: string;
};

type AdminNotificationsSectionProps = {
  onDataChanged: () => void | Promise<void>;
};

const rowStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
};

export default function AdminNotificationsSection({
  onDataChanged,
}: AdminNotificationsSectionProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [allUsers, setAllUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [noticeDialog, setNoticeDialog] = useState<NoticeDialogState | null>(
    null,
  );

  const showNotice = useCallback(
    (tone: AdminDialogTone, noticeTitle: string, message: string) => {
      setNoticeDialog({ tone, title: noticeTitle, message });
    },
    [],
  );

  const loadUsers = useCallback(async () => {
    const result = await fetchAdminUsers();

    if (result.error) {
      showNotice("warning", "Notifications", result.error);
      setLoading(false);
      return;
    }

    setUsers(result.data || []);
    setLoading(false);
  }, [showNotice]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [loadUsers]);

  const selectedCount = useMemo(() => {
    if (allUsers) {
      return users.length;
    }
    return selectedUserIds.length;
  }, [allUsers, selectedUserIds.length, users.length]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((currentId) => currentId !== userId)
        : [...prev, userId],
    );
  }, []);

  const handleSend = useCallback(async () => {
    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();

    if (!normalizedTitle) {
      showNotice("warning", "Missing title", "Enter a notification title.");
      return;
    }

    if (!normalizedBody) {
      showNotice("warning", "Missing message", "Enter notification text.");
      return;
    }

    if (!allUsers && selectedUserIds.length === 0) {
      showNotice("warning", "Select users", "Choose at least one user.");
      return;
    }

    setSubmitting(true);
    const result = await sendAdminNotification({
      title: normalizedTitle,
      body: normalizedBody,
      allUsers,
      userIds: allUsers ? [] : selectedUserIds,
    });
    setSubmitting(false);

    if (result.error) {
      showNotice("warning", "Send failed", result.error);
      return;
    }

    setTitle("");
    setBody("");
    setAllUsers(false);
    setSelectedUserIds([]);
    showNotice(
      "success",
      "Notification sent",
      `Delivered to ${result.data?.sentCount || 0} users.`,
    );
    await Promise.resolve(onDataChanged());
  }, [allUsers, body, onDataChanged, selectedUserIds, showNotice, title]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 40,
        }}
      >
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={["#111827"]}
            tintColor="#111827"
          />
        }
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 18,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
            Send notification
          </Text>
          <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 20 }}>
            Choose one, many, or all users and send an in-app notification.
          </Text>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#374151" }}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Notification title"
              placeholderTextColor="#9ca3af"
              maxLength={180}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: "#111827",
                backgroundColor: "#ffffff",
              }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#374151" }}>
              Message
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write your notification text..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 14,
                minHeight: 92,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: "#111827",
                lineHeight: 20,
                backgroundColor: "#ffffff",
              }}
            />
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => setAllUsers((prev) => !prev)}
            style={{
              ...rowStyle,
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: users.length ? 1 : 0,
              borderBottomColor: "#f3f4f6",
            }}
          >
            <View style={{ ...rowStyle, gap: 10 }}>
              <Ionicons
                name={allUsers ? "checkbox" : "square-outline"}
                size={22}
                color={allUsers ? "#111827" : "#9ca3af"}
              />
              <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                  All users
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>
                  Send to everyone ({users.length})
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {users.map((user, index) => {
            const checked = allUsers || selectedUserIds.includes(user.id);

            return (
              <TouchableOpacity
                key={user.id}
                disabled={allUsers}
                onPress={() => toggleUserSelection(user.id)}
                style={{
                  ...rowStyle,
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: "#f3f4f6",
                  opacity: allUsers ? 0.6 : 1,
                }}
              >
                <View style={{ ...rowStyle, gap: 10, flex: 1 }}>
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={21}
                    color={checked ? "#111827" : "#9ca3af"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}
                      numberOfLines={1}
                    >
                      {user.name}
                    </Text>
                    <Text
                      style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}
                      numberOfLines={1}
                    >
                      @{user.username || "no-username"} • {user.email}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={() => void handleSend()}
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
            {submitting
              ? "Sending..."
              : `Send notification (${selectedCount})`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AdminConfirmDialog
        visible={noticeDialog !== null}
        tone={noticeDialog?.tone || "default"}
        title={noticeDialog?.title || ""}
        message={noticeDialog?.message || ""}
        primaryLabel="OK"
        onPrimary={() => setNoticeDialog(null)}
      />
    </View>
  );
}
