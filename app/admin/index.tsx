import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AdminPostsSection from "../../components/admin/AdminPostsSection";
import AdminReportsSection from "../../components/admin/AdminReportsSection";
import AdminReelsSection from "../../components/admin/AdminReelsSection";
import AdminUsersSection from "../../components/admin/AdminUsersSection";
import AdminNotificationsSection from "../../components/admin/AdminNotificationsSection";
import {
  clearAuth,
  fetchAdminSummary,
  type AdminSummary,
} from "../../services/api";
import { router } from "expo-router";

type AdminTab = "users" | "posts" | "reels" | "notifications" | "reports";

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    const summaryResult = await fetchAdminSummary();

    if (summaryResult.error) {
      setLoading(false);
      return;
    }

    setSummary(summaryResult.data || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleLogout = useCallback(async () => {
    await clearAuth();
    router.replace("/(tabs)");
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 20 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View
        style={{
          paddingTop: insets.top + 22,
          paddingBottom: 14,
          gap: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "700",
                color: "#111827",
                letterSpacing: -0.8,
              }}
            >
              Admin Dashboard
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => void handleLogout()}
            style={{
              backgroundColor: "#111827",
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#e5e7eb",
            borderRadius: 18,
            padding: 4,
          }}
        >
          {(["users", "posts", "reels", "notifications", "reports"] as AdminTab[]).map((tab) => {
            const active = activeTab === tab;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  backgroundColor: active ? "#ffffff" : "transparent",
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#111827",
                    fontSize: 14,
                    fontWeight: "700",
                    textTransform: "capitalize",
                  }}
                >
                  {tab === "notifications" ? "notify" : tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "users" ? (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#ffffff",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total users</Text>
              <Text style={{ fontSize: 23, fontWeight: "700", color: "#111827" }}>
                {summary?.totalUsers ?? 0}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#ffffff",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Banned users</Text>
              <Text style={{ fontSize: 23, fontWeight: "700", color: "#111827" }}>
                {summary?.bannedUsers ?? 0}
              </Text>
            </View>
          </View>
        ) : activeTab === "posts" ? (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 4,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Total posts</Text>
            <Text style={{ fontSize: 23, fontWeight: "700", color: "#111827" }}>
              {summary?.totalPosts ?? 0}
            </Text>
          </View>
        ) : activeTab === "reels" ? (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 4,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Total reels</Text>
            <Text style={{ fontSize: 23, fontWeight: "700", color: "#111827" }}>
              {summary?.totalReels ?? 0}
            </Text>
          </View>
        ) : null}

        {activeTab === "users" ? (
          <AdminUsersSection onDataChanged={loadSummary} />
        ) : activeTab === "posts" ? (
          <AdminPostsSection onDataChanged={loadSummary} />
        ) : activeTab === "reports" ? (
          <AdminReportsSection onDataChanged={loadSummary} />
        ) : activeTab === "notifications" ? (
          <AdminNotificationsSection onDataChanged={loadSummary} />
        ) : (
          <AdminReelsSection onDataChanged={loadSummary} />
        )}
      </View>
    </View>
  );
}
