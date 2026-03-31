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
import AdminReelsSection from "../../components/admin/AdminReelsSection";
import AdminUsersSection from "../../components/admin/AdminUsersSection";
import {
  clearAuth,
  fetchAdminSummary,
  type AdminSummary,
} from "../../services/api";
import { router } from "expo-router";
import { timeAgo } from "../../components/dashboard/helpers";

type AdminTab = "users" | "posts" | "reels";

const summaryCards: {
  key: keyof Pick<
    AdminSummary,
    "totalUsers" | "totalPosts" | "totalReels" | "bannedUsers"
  >;
  label: string;
}[] = [
  { key: "totalUsers", label: "Total users" },
  { key: "totalPosts", label: "Total posts" },
  { key: "totalReels", label: "Total reels" },
  { key: "bannedUsers", label: "Banned users" },
];

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
          paddingBottom: 18,
          gap: 18,
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

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {summaryCards.map((card) => (
            <View
              key={card.key}
              style={{
                width: "48%",
                backgroundColor: "#ffffff",
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 16,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: "#6b7280" }}>{card.label}</Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                {summary?.[card.key] ?? 0}
              </Text>
            </View>
          ))}

          <View
            style={{
              width: "48%",
              backgroundColor: "#ffffff",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: "#6b7280" }}>Recent activity</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              {summary?.recentActivity[0]?.title || "No recent activity"}
            </Text>
            <Text style={{ fontSize: 12, color: "#6b7280", lineHeight: 18 }}>
              {summary?.recentActivity[0]
                ? `${summary.recentActivity[0].subtitle} • ${timeAgo(summary.recentActivity[0].createdAt)}`
                : "Updates from new users and posts appear here."}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#e5e7eb",
            borderRadius: 18,
            padding: 4,
          }}
        >
          {(["users", "posts", "reels"] as AdminTab[]).map((tab) => {
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
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "users" ? (
          <AdminUsersSection onDataChanged={loadSummary} />
        ) : activeTab === "posts" ? (
          <AdminPostsSection onDataChanged={loadSummary} />
        ) : (
          <AdminReelsSection onDataChanged={loadSummary} />
        )}
      </View>
    </View>
  );
}
