import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  blockUser,
  getFriendsList,
  getMe,
  unfriendUser,
  type SearchUserResult,
} from "../services/api";

type TabKey = "friends" | "mutual";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    userId?: string | string[];
    userName?: string | string[];
  }>();

  const targetUserId = getParamValue(params.userId) || "";
  const targetUserName = getParamValue(params.userName) || "Friends";

  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("friends");
  const [isOwnFriendsPage, setIsOwnFriendsPage] = useState(false);
  const [friends, setFriends] = useState<SearchUserResult[]>([]);
  const [mutualFriends, setMutualFriends] = useState<SearchUserResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!targetUserId) {
        if (!cancelled) setLoading(false);
        return;
      }

      const meResult = await getMe();
      const currentUserId = meResult.data?.id || "";
      const ownPage = Boolean(currentUserId && currentUserId === targetUserId);

      const [targetFriendsResult, myFriendsResult] = await Promise.all([
        getFriendsList(targetUserId),
        !ownPage && currentUserId
          ? getFriendsList(currentUserId)
          : Promise.resolve({ data: [] }),
      ]);

      if (cancelled) return;

      const targetFriends = targetFriendsResult.data || [];
      const myFriends = myFriendsResult.data || [];
      const myFriendIdSet = new Set(myFriends.map((user) => user.id));
      const mutual = targetFriends.filter((user) => myFriendIdSet.has(user.id));

      setIsOwnFriendsPage(ownPage);
      setFriends(targetFriends);
      setMutualFriends(mutual);
      setLoading(false);
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  const listData = useMemo(
    () => (activeTab === "friends" ? friends : mutualFriends),
    [activeTab, friends, mutualFriends],
  );

  const removeUserFromLists = (userId: string) => {
    setFriends((prev) => prev.filter((user) => user.id !== userId));
    setMutualFriends((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleUnfriend = async (userId: string) => {
    if (actionUserId) return;
    setActionUserId(userId);
    const result = await unfriendUser(userId);
    setActionUserId(null);
    if (!result.data) return;
    removeUserFromLists(userId);
  };

  const handleBlock = async (userId: string) => {
    if (actionUserId) return;
    setActionUserId(userId);
    const result = await blockUser(userId);
    setActionUserId(null);
    if (!result.data) return;
    removeUserFromLists(userId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 14,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#111827",
          backgroundColor: "#000000",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#111827",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#f9fafb" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 17,
            fontWeight: "700",
            color: "#f9fafb",
            marginRight: 38,
          }}
        >
          {targetUserName}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#111827",
          borderRadius: 14,
          marginHorizontal: 14,
          marginTop: 12,
          padding: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("friends")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "friends" ? "#1f2937" : "transparent",
            borderRadius: 10,
            paddingVertical: 9,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#f9fafb", fontSize: 14, fontWeight: "700" }}>
            Friends
          </Text>
        </TouchableOpacity>

        {!isOwnFriendsPage ? (
          <TouchableOpacity
            onPress={() => setActiveTab("mutual")}
            style={{
              flex: 1,
              backgroundColor: activeTab === "mutual" ? "#1f2937" : "transparent",
              borderRadius: 10,
              paddingVertical: 9,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#f9fafb", fontSize: 14, fontWeight: "700" }}>
              Mutual Friends
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 30 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 70 }}>
              <Ionicons name="people-outline" size={44} color="#4b5563" />
              <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 10 }}>
                {activeTab === "friends" ? "No friends to show" : "No mutual friends"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                marginHorizontal: 14,
                marginBottom: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#0b1220",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#111827",
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {item.avatarUrl ? (
                  <Image
                    source={{ uri: item.avatarUrl }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#111827",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#1f2937",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#f9fafb", fontSize: 16, fontWeight: "700" }}>
                      {item.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}>
                    {item.name}
                  </Text>
                  {item.username ? (
                    <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
                      @{item.username}
                    </Text>
                  ) : null}
                </View>
              </View>

              {isOwnFriendsPage && activeTab === "friends" ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    disabled={actionUserId === item.id}
                    onPress={() => void handleUnfriend(item.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#111827",
                      borderWidth: 1,
                      borderColor: "#374151",
                      borderRadius: 10,
                      paddingVertical: 8,
                      alignItems: "center",
                      opacity: actionUserId === item.id ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ color: "#f9fafb", fontSize: 13, fontWeight: "700" }}>
                      {actionUserId === item.id ? "Working..." : "Unfriend"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={actionUserId === item.id}
                    onPress={() => void handleBlock(item.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#3f1d1d",
                      borderWidth: 1,
                      borderColor: "#7f1d1d",
                      borderRadius: 10,
                      paddingVertical: 8,
                      alignItems: "center",
                      opacity: actionUserId === item.id ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ color: "#f9fafb", fontSize: 13, fontWeight: "700" }}>
                      {actionUserId === item.id ? "Working..." : "Block"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}
