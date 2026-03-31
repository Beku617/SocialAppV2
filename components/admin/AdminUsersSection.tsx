import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  banAdminUser,
  deleteAdminUser,
  fetchAdminUserDetails,
  fetchAdminUsers,
  unbanAdminUser,
  type AdminUser,
  type AdminUserDetailsResponse,
  type BanDuration,
} from "../../services/api";
import { timeAgo } from "../dashboard/helpers";
import AdminConfirmDialog, { type AdminDialogTone } from "./AdminConfirmDialog";

const BAN_OPTIONS: { label: string; value: BanDuration }[] = [
  { label: "1 day", value: "1d" },
  { label: "3 days", value: "3d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "Forever", value: "forever" },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const getBanStatusLabel = (user: AdminUser) => {
  if (!user.ban.active) {
    return "Active";
  }

  if (user.ban.permanent) {
    return "Banned forever";
  }

  return user.ban.expiresAt
    ? `Banned until ${new Date(user.ban.expiresAt).toLocaleDateString()}`
    : "Banned";
};

type AdminUsersSectionProps = {
  onDataChanged: () => void | Promise<void>;
};

type NoticeDialogState = {
  tone: AdminDialogTone;
  title: string;
  message: string;
};

export default function AdminUsersSection({
  onDataChanged,
}: AdminUsersSectionProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] =
    useState<AdminUserDetailsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [noticeDialog, setNoticeDialog] = useState<NoticeDialogState | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

  const showNotice = useCallback(
    (tone: AdminDialogTone, title: string, message: string) => {
      setNoticeDialog({ tone, title, message });
    },
    [],
  );

  const loadUsers = useCallback(async () => {
    const result = await fetchAdminUsers();

    if (result.error) {
      showNotice("warning", "Users", result.error);
      setLoading(false);
      return;
    }

    setUsers(result.data || []);
    setLoading(false);
  }, [showNotice]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const refreshAll = useCallback(async () => {
    await loadUsers();
    await Promise.resolve(onDataChanged());
  }, [loadUsers, onDataChanged]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handleViewUser = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedUserDetails(null);
    setDetailsLoading(true);

    const result = await fetchAdminUserDetails(userId);
    setDetailsLoading(false);

    if (result.error) {
      showNotice("warning", "User details", result.error);
      return;
    }

    setSelectedUserDetails(result.data || null);
  }, [showNotice]);

  const handleBan = useCallback(
    async (duration: BanDuration) => {
      if (!banTarget) return;

      setActionKey(`ban-${banTarget.id}`);
      const result = await banAdminUser(banTarget.id, duration);
      setActionKey(null);
      setBanTarget(null);

      if (result.error) {
        showNotice("warning", "Ban user", result.error);
        return;
      }

      showNotice(
        "success",
        "User banned",
        `${banTarget.name} has been banned successfully.`,
      );
      await refreshAll();
    },
    [banTarget, refreshAll, showNotice],
  );

  const handleUnban = useCallback(
    async (user: AdminUser) => {
      setActionKey(`unban-${user.id}`);
      const result = await unbanAdminUser(user.id);
      setActionKey(null);

      if (result.error) {
        showNotice("warning", "Unban user", result.error);
        return;
      }

      showNotice("success", "User restored", `${user.name} is active again.`);
      await refreshAll();
    },
    [refreshAll, showNotice],
  );

  const handleDeleteUser = useCallback(async () => {
    if (!deleteTarget) return;

    setActionKey(`delete-${deleteTarget.id}`);
    const result = await deleteAdminUser(deleteTarget.id);
    setActionKey(null);

    if (result.error) {
      showNotice("warning", "Delete user", result.error);
      return;
    }

    showNotice("success", "User deleted", `${deleteTarget.name} has been removed.`);
    if (selectedUserId === deleteTarget.id) {
      setSelectedUserId(null);
      setSelectedUserDetails(null);
    }
    setDeleteTarget(null);
    await refreshAll();
  }, [deleteTarget, refreshAll, selectedUserId, showNotice]);

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
        contentContainerStyle={{ paddingBottom: 36 }}
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
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {users.map((user, index) => {
            const isBusy =
              actionKey === `ban-${user.id}` ||
              actionKey === `unban-${user.id}` ||
              actionKey === `delete-${user.id}`;

            return (
              <View
                key={user.id}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: "#f3f4f6",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {user.name}
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      @{user.username || "no-username"} • {user.email}
                    </Text>
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      {user.role} • Joined {timeAgo(user.createdAt)} •{" "}
                      {user.postCount} posts
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: user.ban.active ? "#fef2f2" : "#ecfdf5",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: user.ban.active ? "#b91c1c" : "#047857",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {getBanStatusLabel(user)}
                    </Text>
                  </View>
                </View>

                {user.bio ? (
                  <Text style={{ color: "#374151", fontSize: 14, lineHeight: 21 }}>
                    {user.bio}
                  </Text>
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => void handleViewUser(user.id)}
                    style={{
                      backgroundColor: "#111827",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      View
                    </Text>
                  </TouchableOpacity>

                  {user.ban.active ? (
                    <TouchableOpacity
                      disabled={!user.canManage || isBusy}
                      onPress={() => void handleUnban(user)}
                      style={{
                        backgroundColor: user.canManage ? "#ecfeff" : "#f3f4f6",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 14,
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: user.canManage ? "#155e75" : "#9ca3af",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        {isBusy ? "Working..." : "Unban"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      disabled={!user.canManage || isBusy}
                      onPress={() => setBanTarget(user)}
                      style={{
                        backgroundColor: user.canManage ? "#fef3c7" : "#f3f4f6",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 14,
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: user.canManage ? "#92400e" : "#9ca3af",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        Ban
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    disabled={!user.canManage || isBusy}
                    onPress={() => setDeleteTarget(user)}
                    style={{
                      backgroundColor: user.canManage ? "#fee2e2" : "#f3f4f6",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: user.canManage ? "#b91c1c" : "#9ca3af",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {isBusy ? "Working..." : "Delete"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {!user.canManage ? (
                  <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                    Protected admin account
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AdminConfirmDialog
        visible={deleteTarget !== null}
        tone="danger"
        title="Delete user"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name}? This action cannot be undone.`
            : ""
        }
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimary={() => void handleDeleteUser()}
        onSecondary={() => setDeleteTarget(null)}
      />

      <AdminConfirmDialog
        visible={noticeDialog !== null}
        tone={noticeDialog?.tone || "default"}
        title={noticeDialog?.title || ""}
        message={noticeDialog?.message || ""}
        primaryLabel="OK"
        onPrimary={() => setNoticeDialog(null)}
      />

      <Modal
        visible={banTarget !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setBanTarget(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.42)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 28,
              padding: 22,
              borderWidth: 1,
              borderColor: "#fef3c7",
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.12,
              shadowRadius: 28,
              elevation: 10,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#fffbeb",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#d97706"
              />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
              Ban user
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 14, lineHeight: 21 }}>
              Select how long {banTarget?.name} should be banned.
            </Text>

            {BAN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => void handleBan(option.value)}
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: "#f3f4f6",
                }}
              >
                <Text
                  style={{ color: "#111827", fontSize: 15, fontWeight: "600" }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setBanTarget(null)}
              style={{
                marginTop: 6,
                alignItems: "center",
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 14, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedUserId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedUserId(null);
          setSelectedUserDetails(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>
              User details
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedUserId(null);
                setSelectedUserDetails(null);
              }}
            >
              <Text style={{ color: "#111827", fontSize: 15, fontWeight: "700" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {detailsLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 18,
                gap: 18,
              }}
            >
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 24,
                  padding: 18,
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {selectedUserDetails?.user.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  @{selectedUserDetails?.user.username} •{" "}
                  {selectedUserDetails?.user.email}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Role: {selectedUserDetails?.user.role}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Created: {formatDateTime(selectedUserDetails?.user.createdAt)}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Ban status:{" "}
                  {selectedUserDetails?.user
                    ? getBanStatusLabel(selectedUserDetails.user)
                    : "N/A"}
                </Text>
                {selectedUserDetails?.user.bio ? (
                  <Text style={{ fontSize: 14, color: "#374151", lineHeight: 21 }}>
                    {selectedUserDetails.user.bio}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 24,
                  padding: 18,
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                  Account stats
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Posts: {selectedUserDetails?.user.postCount ?? 0}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Followers: {selectedUserDetails?.user.followersCount ?? 0}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Following: {selectedUserDetails?.user.followingCount ?? 0}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 24,
                  padding: 18,
                  gap: 14,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                  Recent posts
                </Text>

                {selectedUserDetails?.recentPosts.length ? (
                  selectedUserDetails.recentPosts.map((post) => (
                    <View
                      key={post.id}
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: "#f3f4f6",
                        paddingTop: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {post.caption || "Image post"}
                      </Text>
                      <Text
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        {timeAgo(post.createdAt)} • {post.status}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 14, color: "#9ca3af" }}>
                    No posts yet.
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
