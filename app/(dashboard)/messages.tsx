import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserProfileModal from "../../components/dashboard/UserProfileModal";
import {
  sendMessage as apiSendMessage,
  sendFriendRequest,
  getConversations,
  getMe,
  getMessages,
  getUserProfile,
  registerPushToken,
  searchUsers,
  type ChatMessage,
  type ConversationItem,
  type SearchUserResult,
  type UserProfile,
} from "../../services/api";
import { sendLocalNotification } from "../../notifications";

// ─── IG Dark Theme Colors ───────────────────────────────────────────────
const COLORS = {
  bg: "#000000",
  surface: "#121212",
  card: "#1a1a1a",
  searchBg: "#262626",
  text: "#ffffff",
  textSecondary: "#a8a8a8",
  textMuted: "#737373",
  accent: "#3797f0",
  border: "#262626",
  online: "#2ecc71",
  unread: "#3797f0",
  bubbleMe: "#3797f0",
  bubbleOther: "#262626",
  inputBg: "#262626",
};

// ─── Chat Screen ────────────────────────────────────────────────────────
function ChatScreen({
  userId,
  userName,
  userAvatar,
  currentUserId,
  onBack,
  onViewProfile,
}: {
  userId: string;
  userName: string;
  userAvatar: string;
  currentUserId: string | null;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const hasHydratedMessagesRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    hasHydratedMessagesRef.current = false;
    latestMessageIdRef.current = null;
    (async () => {
      const res = await getMessages(userId);
      if (res.data) {
        setMessages(res.data.messages);
        const latest = res.data.messages[res.data.messages.length - 1];
        latestMessageIdRef.current = latest ? latest.id : null;
        hasHydratedMessagesRef.current = true;
      }
      setLoading(false);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: false }),
        200,
      );
    })();
  }, [userId]);

  useEffect(() => {
    let stoppedByNetworkError = false;
    const interval = setInterval(async () => {
      if (stoppedByNetworkError) return;

      const res = await getMessages(userId);
      if (res.data) {
        const list = res.data.messages;
        const latest = list[list.length - 1];

        if (
          hasHydratedMessagesRef.current &&
          latest &&
          latest.id !== latestMessageIdRef.current &&
          latest.senderId !== currentUserId
        ) {
          void sendLocalNotification({
            title: userName || "New message",
            body: latest.text,
            data: { type: "dm", userId, userName },
          });
        }

        latestMessageIdRef.current = latest
          ? latest.id
          : latestMessageIdRef.current;
        setMessages(list);
        return;
      }

      if (res.error?.toLowerCase().includes("network")) {
        stoppedByNetworkError = true;
        clearInterval(interval);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUserId, userId, userName]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);
    const res = await apiSendMessage(userId, msgText);
    if (res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } else if (res.error) {
      Alert.alert("Error", res.error);
      setText(msgText);
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (diffDays === 0) return time;
    if (diffDays === 1) return `Yesterday ${time}`;
    if (diffDays < 7)
      return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View
        style={{
          alignSelf: isMe ? "flex-end" : "flex-start",
          maxWidth: "78%",
          marginVertical: 3,
          marginHorizontal: 14,
        }}
      >
        {!isMe && (
          <View
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}
          >
            <Image
              source={{
                uri:
                  userAvatar ||
                  `https://ui-avatars.com/api/?name=${userName}&background=333&color=fff`,
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                marginBottom: 18,
              }}
            />
            <View>
              <View
                style={{
                  backgroundColor: COLORS.bubbleOther,
                  borderRadius: 20,
                  borderBottomLeftRadius: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{ fontSize: 15, color: COLORS.text, lineHeight: 20 }}
                >
                  {item.text}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginTop: 3,
                  marginLeft: 4,
                }}
              >
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
        {isMe && (
          <View>
            <View
              style={{
                backgroundColor: COLORS.bubbleMe,
                borderRadius: 20,
                borderBottomRightRadius: 4,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 15, color: "#fff", lineHeight: 20 }}>
                {item.text}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 10,
                color: COLORS.textMuted,
                marginTop: 3,
                alignSelf: "flex-end",
                marginRight: 4,
              }}
            >
              {formatTime(item.createdAt)}
              {item.read ? "  ✓✓" : "  ✓"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Chat Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: COLORS.bg,
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onViewProfile(userId)}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri:
                userAvatar ||
                `https://ui-avatars.com/api/?name=${userName}&background=333&color=fff`,
            }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onViewProfile(userId)}
          style={{ flex: 1 }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>
            {userName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
            Active now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ padding: 6 }}>
          <Ionicons name="call-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 6 }}>
          <Ionicons name="videocam-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingVertical: 16,
            flexGrow: 1,
            justifyContent: messages.length === 0 ? "center" : "flex-end",
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 40 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.card,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name="hand-right-outline"
                  size={36}
                  color={COLORS.accent}
                />
              </View>
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: COLORS.text }}
              >
                Say hello!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Start a conversation with {userName}
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* Input Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8,
          backgroundColor: COLORS.bg,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.border,
          gap: 10,
        }}
      >
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="camera-outline" size={24} color={COLORS.accent} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.inputBg,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: COLORS.border,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === "ios" ? 10 : 6,
            maxHeight: 120,
          }}
        >
          <TextInput
            style={{ fontSize: 15, color: COLORS.text, maxHeight: 100 }}
            placeholder="Message..."
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
        </View>

        {text.trim() ? (
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Ionicons name="send" size={22} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", gap: 2 }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="mic-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Helper: format relative activity time ──────────────────────────────
function formatActivityTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Active now";
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays === 1) return "Active yesterday";
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  return `Active ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

// ─── Messages Tab Screen (IG Style) ─────────────────────────────────────
export default function MessagesScreen() {
  const params = useLocalSearchParams<{
    userId?: string | string[];
    userName?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"Messages" | "Requests">(
    "Messages",
  );
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUserResult[]>([]);
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());
  const [friendActionByUserId, setFriendActionByUserId] = useState<
    Record<string, "idle" | "pending" | "friends">
  >({});
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [chatTarget, setChatTarget] = useState<{
    userId: string;
    name: string;
    avatar: string;
  } | null>(null);
  const openedFromNotificationRef = useRef<string | null>(null);
  const lastSeenConversationMessageRef = useRef<Map<string, string>>(
    new Map(),
  );
  const conversationsReadyRef = useRef(false);

  const dmUserIdParam = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const dmUserNameParam = Array.isArray(params.userName)
    ? params.userName[0]
    : params.userName;

  useEffect(() => {
    (async () => {
      const me = await getMe();
      if (me.data) {
        setCurrentUserId(me.data.id);
        setCurrentUser(me.data);
      }
    })();
    loadConversations();
    loadSuggestedUsers();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    const syncPushToken = async () => {
      try {
        const { registerForPushNotificationsAsync } = await import(
          "../../notifications"
        );
        const token = await registerForPushNotificationsAsync();
        if (!token || cancelled) return;
        await registerPushToken(token);
      } catch (error) {
        console.warn("[messages] push token sync failed:", error);
      }
    };

    void syncPushToken();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!dmUserIdParam || openedFromNotificationRef.current === dmUserIdParam) {
      return;
    }

    let mounted = true;

    const openDmFromNotification = async () => {
      const profileRes = await getUserProfile(dmUserIdParam);
      if (!mounted) return;

      const profileUser = profileRes.data?.user;
      setChatTarget({
        userId: dmUserIdParam,
        name: profileUser?.name || dmUserNameParam || "User",
        avatar: profileUser?.avatarUrl || "",
      });
      openedFromNotificationRef.current = dmUserIdParam;
    };

    void openDmFromNotification();

    return () => {
      mounted = false;
    };
  }, [dmUserIdParam, dmUserNameParam]);

  const loadSuggestedUsers = async () => {
    // Fetch users with broad queries to get suggestions
    const queries = ["a", "e", "i", "o"];
    const allUsers: SearchUserResult[] = [];
    const seenIds = new Set<string>();

    for (const q of queries) {
      const res = await searchUsers(q);
      if (res.data) {
        for (const user of res.data) {
          if (!seenIds.has(user.id)) {
            seenIds.add(user.id);
            allUsers.push(user);
          }
        }
      }
    }
    setSuggestedUsers(allUsers);
  };

  const handleAddFriend = async (userId: string) => {
    const currentState = friendActionByUserId[userId] || "idle";
    if (currentState !== "idle") return;

    const res = await sendFriendRequest(userId);
    if (!res.data) {
      Alert.alert("Error", res.error || "Failed to send friend request");
      return;
    }

    setFriendActionByUserId((prev) => ({
      ...prev,
      [userId]: res.data?.status === "friends" ? "friends" : "pending",
    }));
  };

  const handleDismissSuggestion = (userId: string) => {
    setDismissedUsers((prev) => new Set(prev).add(userId));
  };

  const openProfile = (userId: string) => {
    setProfileUserId(userId);
    setProfileVisible(true);
  };

  const handleNewConversationNotifications = (
    list: ConversationItem[],
  ) => {
    for (const convo of list) {
      const lastId = convo.lastMessage?.id;
      const prevId = lastSeenConversationMessageRef.current.get(convo.user.id);
      const shouldNotify =
        conversationsReadyRef.current &&
        !!currentUserId &&
        !!lastId &&
        prevId !== lastId &&
        convo.lastMessage.senderId !== currentUserId;

      if (lastId) {
        lastSeenConversationMessageRef.current.set(convo.user.id, lastId);
      }

      if (shouldNotify) {
        void sendLocalNotification({
          title: convo.user.name || "New message",
          body: convo.lastMessage.text,
          data: {
            type: "dm",
            userId: convo.user.id,
            userName: convo.user.name,
          },
        });
      }
    }

    if (!conversationsReadyRef.current) {
      conversationsReadyRef.current = true;
    }
  };

  const loadConversations = async () => {
    const firstLoad = !conversationsReadyRef.current;
    if (firstLoad) setLoading(true);
    const res = await getConversations();
    if (res.data) {
      handleNewConversationNotifications(res.data);
      setConversations(res.data);
    }
    if (firstLoad) setLoading(false);
  };

  // Poll when on conversation list
  useEffect(() => {
    if (chatTarget) return;
    let stoppedByNetworkError = false;
    const interval = setInterval(async () => {
      if (stoppedByNetworkError) return;

      const res = await getConversations();
      if (res.data) {
        handleNewConversationNotifications(res.data);
        setConversations(res.data);
        return;
      }

      if (res.error?.toLowerCase().includes("network")) {
        stoppedByNetworkError = true;
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [chatTarget, currentUserId]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(searchQuery.trim());
      if (res.data) setSearchResults(res.data);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // ── Chat view ─────────────────────────────────────────────────────────
  if (chatTarget) {
    return (
      <>
        <ChatScreen
          userId={chatTarget.userId}
          userName={chatTarget.name}
          userAvatar={chatTarget.avatar}
          currentUserId={currentUserId}
          onBack={() => {
            setChatTarget(null);
            loadConversations();
          }}
          onViewProfile={openProfile}
        />
        <UserProfileModal
          visible={profileVisible}
          userId={profileUserId}
          onClose={() => setProfileVisible(false)}
          onMessage={(userId, name, avatar) => {
            setProfileVisible(false);
            setChatTarget({ userId, name, avatar });
          }}
        />
      </>
    );
  }

  const displayName = currentUser?.name || "Messages";

  // ── IG-style Conversations list ───────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* IG Header */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: COLORS.bg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: filter icon */}
          <TouchableOpacity style={{ padding: 4, width: 70 }}>
            <Ionicons name="options-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>

          {/* Center: username + online dot */}
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: COLORS.text,
                letterSpacing: -0.3,
              }}
            >
              {displayName}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.text} />
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#ff3040",
                marginLeft: 2,
              }}
            />
          </TouchableOpacity>

          {/* Right: compose icon */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: 38,
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity>
              <Ionicons name="create-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.searchBg,
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 40,
            gap: 10,
          }}
        >
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 15,
              color: COLORS.text,
              paddingVertical: 0,
            }}
            placeholder="Search"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchQuery.trim().length > 0 ? (
        <View style={{ flex: 1 }}>
          {searching ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          ) : searchResults.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text
                style={{
                  fontSize: 15,
                  color: COLORS.textSecondary,
                  fontWeight: "600",
                  marginTop: 12,
                }}
              >
                No users found
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setChatTarget({
                      userId: item.id,
                      name: item.name,
                      avatar: item.avatarUrl || "",
                    });
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    gap: 12,
                  }}
                  activeOpacity={0.6}
                >
                  <TouchableOpacity
                    onPress={() => openProfile(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.avatarUrl ? (
                      <Image
                        source={{ uri: item.avatarUrl }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: COLORS.card,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: COLORS.text,
                          }}
                        >
                          {item.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: COLORS.text,
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.username && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: COLORS.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        @{item.username}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.user.id}
          ListHeaderComponent={
            <>
              {/* Notes / Stories Row */}
              <View style={{ paddingBottom: 12 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                >
                  {/* Your Note */}
                  <View style={{ alignItems: "center", width: 76 }}>
                    <View style={{ position: "relative" }}>
                      {currentUser?.avatarUrl ? (
                        <Image
                          source={{ uri: currentUser.avatarUrl }}
                          style={{ width: 72, height: 72, borderRadius: 36 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            backgroundColor: COLORS.card,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 28,
                              fontWeight: "700",
                              color: COLORS.text,
                            }}
                          >
                            {displayName?.charAt(0)?.toUpperCase() || "?"}
                          </Text>
                        </View>
                      )}
                      {/* Note bubble */}
                      <View
                        style={{
                          position: "absolute",
                          top: -8,
                          left: -4,
                          backgroundColor: COLORS.card,
                          borderRadius: 14,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        }}
                      >
                        <Text
                          style={{ fontSize: 11, color: COLORS.textSecondary }}
                        >
                          Note...
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: COLORS.text,
                        marginTop: 6,
                        textAlign: "center",
                      }}
                      numberOfLines={1}
                    >
                      Your note
                    </Text>
                  </View>

                  {/* Map */}
                  <View style={{ alignItems: "center", width: 76 }}>
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: "#1a3a5c",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <Ionicons name="earth" size={48} color="#4a9eff" />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: COLORS.text,
                        marginTop: 6,
                        textAlign: "center",
                      }}
                    >
                      Map
                    </Text>
                  </View>
                </ScrollView>
              </View>

              {/* Filter Tabs */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                  gap: 10,
                }}
              >
                {(["Messages", "Requests"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={{
                      backgroundColor:
                        activeTab === tab ? COLORS.text : COLORS.searchBg,
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: activeTab === tab ? COLORS.bg : COLORS.text,
                      }}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          }
          contentContainerStyle={{
            paddingBottom: 20,
            flexGrow: conversations.length === 0 && !loading ? 1 : undefined,
          }}
          ListEmptyComponent={
            loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingTop: 60,
                }}
              >
                <ActivityIndicator size="large" color={COLORS.accent} />
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingTop: 40,
                }}
              >
                <View
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    borderWidth: 2,
                    borderColor: COLORS.text,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={40}
                    color={COLORS.text}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: COLORS.text,
                    marginBottom: 6,
                  }}
                >
                  No messages yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: COLORS.textSecondary,
                    textAlign: "center",
                    maxWidth: 260,
                    lineHeight: 20,
                  }}
                >
                  Search for people to start a conversation
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const isMyMsg = item.lastMessage.senderId === currentUserId;
            const hasUnread = item.unreadCount > 0;

            return (
              <TouchableOpacity
                onPress={() =>
                  setChatTarget({
                    userId: item.user.id,
                    name: item.user.name,
                    avatar: item.user.avatarUrl || "",
                  })
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  gap: 14,
                }}
                activeOpacity={0.6}
              >
                {/* Avatar */}
                <TouchableOpacity
                  onPress={() => openProfile(item.user.id)}
                  activeOpacity={0.7}
                >
                  <View>
                    {item.user.avatarUrl ? (
                      <Image
                        source={{ uri: item.user.avatarUrl }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: COLORS.card,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 22,
                            fontWeight: "700",
                            color: COLORS.text,
                          }}
                        >
                          {item.user.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    {/* Online dot */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 1,
                        right: 1,
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: COLORS.online,
                        borderWidth: 2.5,
                        borderColor: COLORS.bg,
                      }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Text content */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: hasUnread ? "700" : "400",
                      color: COLORS.text,
                    }}
                  >
                    {item.user.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {isMyMsg ? "You: " : ""}
                    {item.lastMessage.text} ·{" "}
                    {formatTime(item.lastMessage.createdAt)}
                  </Text>
                </View>

                {/* Right side: unread badge */}
                {hasUnread ? (
                  <View
                    style={{
                      backgroundColor: COLORS.accent,
                      borderRadius: 11,
                      minWidth: 22,
                      height: 22,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 7,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#fff",
                      }}
                    >
                      {item.unreadCount}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: 22 }} />
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={(() => {
            // Filter out current user, existing conversations, and dismissed users
            const conversationUserIds = new Set(
              conversations.map((c) => c.user.id),
            );
            const filtered = suggestedUsers.filter(
              (u) =>
                u.id !== currentUserId &&
                !conversationUserIds.has(u.id) &&
                !dismissedUsers.has(u.id),
            );
            if (filtered.length === 0) return null;
            return (
              <View style={{ paddingTop: 28, paddingHorizontal: 16 }}>
                {/* Accounts to add friend section header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: COLORS.text,
                    }}
                  >
                    Accounts to add friend
                  </Text>
                </View>

                {/* Suggested user cards */}
                {filtered.map((user) => {
                  const actionState = friendActionByUserId[user.id] || "idle";
                  const disabled = actionState !== "idle";
                  return (
                    <View
                      key={user.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        gap: 14,
                      }}
                    >
                      {/* Avatar */}
                      <TouchableOpacity
                        onPress={() => openProfile(user.id)}
                        activeOpacity={0.7}
                      >
                        {user.avatarUrl ? (
                          <Image
                            source={{ uri: user.avatarUrl }}
                            style={{ width: 52, height: 52, borderRadius: 26 }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 26,
                              backgroundColor: COLORS.card,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 20,
                                fontWeight: "700",
                                color: COLORS.text,
                              }}
                            >
                              {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Name + subtitle */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: COLORS.text,
                          }}
                          numberOfLines={1}
                        >
                          {user.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: COLORS.textSecondary,
                            marginTop: 1,
                          }}
                        >
                          Suggested for you
                        </Text>
                      </View>

                      {/* Add Friend button */}
                      <TouchableOpacity
                        disabled={disabled}
                        onPress={() => void handleAddFriend(user.id)}
                        style={{
                          backgroundColor: actionState === "idle"
                            ? COLORS.accent
                            : COLORS.searchBg,
                          opacity: disabled ? 0.85 : 1,
                          borderWidth: actionState === "friends" ? 1 : 0,
                          borderColor: actionState === "friends"
                            ? COLORS.searchBg
                            : "transparent",
                          borderRadius: 8,
                          paddingHorizontal: 20,
                          paddingVertical: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: COLORS.text,
                          }}
                        >
                          {actionState === "friends"
                            ? "Friends"
                            : actionState === "pending"
                              ? "Requested"
                              : "Add Friend"}
                        </Text>
                      </TouchableOpacity>

                      {/* Dismiss X button */}
                      <TouchableOpacity
                        onPress={() => handleDismissSuggestion(user.id)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="close"
                          size={20}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        />
      )}

      {/* Profile Modal */}
      <UserProfileModal
        visible={profileVisible}
        userId={profileUserId}
        onClose={() => setProfileVisible(false)}
        onMessage={(userId, name, avatar) => {
          setProfileVisible(false);
          setChatTarget({ userId, name, avatar });
        }}
      />
    </View>
  );
}
