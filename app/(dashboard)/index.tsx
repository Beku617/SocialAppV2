import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  createStory,
  fetchPosts,
  fetchStories,
  getMe,
  getUser,
  seedPosts,
  type Post,
  type StoryGroup,
} from "../../services/api";

import ChatModal from "../../components/dashboard/ChatModal";
import CreateOptionsSheet from "../../components/dashboard/CreateOptionsSheet";
import FeedLoadingScreen from "../../components/dashboard/FeedLoadingScreen";
import FeedActionDialog from "../../components/dashboard/FeedActionDialog";
import Header from "../../components/dashboard/Header";
import PostCard from "../../components/dashboard/PostCard";
import SearchModal from "../../components/dashboard/SearchModal";
import StoriesSection from "../../components/dashboard/StoriesSection";
import StoryViewerModal from "../../components/dashboard/StoryViewerModal";
import UserProfileModal from "../../components/dashboard/UserProfileModal";

// ─── Main Screen ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("User");
  const [viewingStory, setViewingStory] = useState<StoryGroup | null>(null);
  const [creatingStory, setCreatingStory] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [createOptionsVisible, setCreateOptionsVisible] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<{
    userId: string;
    name: string;
    avatar: string;
  } | null>(null);
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    primaryLabel: string;
    secondaryLabel?: string;
    tone?: "default" | "success" | "danger" | "warning";
  }>({
    visible: false,
    title: "",
    message: "",
    primaryLabel: "OK",
  });


  const loadData = async () => {
    const [postsResult, storiesResult] = await Promise.all([
      fetchPosts(),
      fetchStories(),
    ]);

    if (postsResult.data && postsResult.data.length > 0) {
      setPosts(postsResult.data);
    } else if (postsResult.data && postsResult.data.length === 0) {
      console.log("[HOME] No posts found, seeding...");
      await seedPosts();
      const retry = await fetchPosts();
      if (retry.data) setPosts(retry.data);
    }

    if (storiesResult.data) {
      setStoryGroups(storiesResult.data);
    }

    if (postsResult.error)
      console.warn("[HOME] fetchPosts error:", postsResult.error);
    if (storiesResult.error)
      console.warn("[HOME] fetchStories error:", storiesResult.error);
  };

  useEffect(() => {
    (async () => {
      const meResult = await getMe();
      if (meResult.data) {
        setCurrentUserId(meResult.data.id);
        setUserAvatar(meResult.data.avatarUrl || "");
        setUserName(meResult.data.name);
      } else {
        const user = await getUser();
        if (user?.id) setCurrentUserId(user.id);
        if (user?.name) setUserName(user.name);
      }
      await loadData();
      setLoading(false);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const meResult = await getMe();
    if (meResult.data) {
      setUserAvatar(meResult.data.avatarUrl || "");
      setUserName(meResult.data.name);
    }
    await loadData();
    setRefreshing(false);
  }, []);

  const handleLikeToggled = useCallback(
    (postId: string, liked: boolean, _count: number) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const newLikes = liked
            ? [...p.likes, currentUserId || ""]
            : p.likes.filter((id: string) => id !== currentUserId);
          return { ...p, likes: newLikes };
        }),
      );
    },
    [currentUserId],
  );

  const handleRemovePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const handleHideAuthor = useCallback((authorId: string) => {
    setPosts((prev) => prev.filter((post) => post.author.id !== authorId));
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleCreateOptionSelect = useCallback(
    (option: "post" | "story" | "reel" | "live") => {
      setCreateOptionsVisible(false);

      if (option === "live") {
        setDialogState({
          visible: true,
          title: "Live is coming soon",
          message: "Live creation is not available yet. You can already create posts, stories, and reels.",
          primaryLabel: "OK",
          tone: "default",
        });
        return;
      }

      router.push({
        pathname: "/create-reel",
        params: { mode: option },
      });
    },
    [],
  );

  // ─── Create Story ──────────────────────────────────────────────────
  const handleCreateStory = async () => {
    if (creatingStory) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow gallery access to create a story.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.3,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType || "image/jpeg";
    const imageData = asset.base64
      ? `data:${mime};base64,${asset.base64}`
      : asset.uri;

    setCreatingStory(true);
    const { error } = await createStory(imageData);
    setCreatingStory(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    // Refresh stories
    const storiesResult = await fetchStories();
    if (storiesResult.data) {
      setStoryGroups(storiesResult.data);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        currentUserId={currentUserId}
        onLikeToggled={handleLikeToggled}
        onRemovePost={handleRemovePost}
        onHideAuthor={handleHideAuthor}
      />
    ),
    [currentUserId, handleHideAuthor, handleLikeToggled, handleRemovePost],
  );

  const ListHeader = useCallback(
    () => (
      <>
        <StoriesSection
          storyGroups={storyGroups}
          currentUserId={currentUserId}
          userAvatar={userAvatar}
          userName={userName}
          onCreateStory={handleCreateStory}
          onViewStory={(group) => setViewingStory(group)}
        />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storyGroups, currentUserId, userAvatar, userName, creatingStory],
  );

  if (loading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <FeedLoadingScreen />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Header
        avatarUrl={userAvatar}
        userName={userName}
        onSearchPress={() => setSearchVisible(true)}
        onCreatePress={() => setCreateOptionsVisible(true)}
      />

      {/* Creating story indicator */}
      {creatingStory && (
        <View
          style={{
            backgroundColor: "#4f46e5",
            paddingVertical: 8,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>
            Uploading story...
          </Text>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View
            style={{
              padding: 40,
              alignItems: "center",
            }}
          >
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#9ca3af",
                marginTop: 12,
              }}
            >
              No posts yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#d1d5db",
                marginTop: 4,
              }}
            >
              Be the first to share something!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4f46e5"]}
            tintColor="#4f46e5"
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: "#000000" }}
        contentContainerStyle={{ paddingBottom: 8 }}
      />

      {/* Story Viewer */}
      <StoryViewerModal
        visible={viewingStory !== null}
        storyGroup={viewingStory}
        onClose={() => setViewingStory(null)}
        currentUserId={currentUserId}
        onDeleted={async () => {
          const res = await fetchStories();
          if (res.data) setStoryGroups(res.data);
        }}
      />

      {/* Search Modal */}
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onViewProfile={(userId) => {
          setSearchVisible(false);
          setProfileUserId(userId);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        visible={profileUserId !== null}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onMessage={(uid, name, avatar) => {
          setProfileUserId(null);
          setChatTarget({ userId: uid, name, avatar });
        }}
      />

      {/* Chat Modal */}
      <ChatModal
        visible={chatTarget !== null}
        userId={chatTarget?.userId ?? null}
        userName={chatTarget?.name ?? ""}
        userAvatar={chatTarget?.avatar ?? ""}
        currentUserId={currentUserId}
        onClose={() => setChatTarget(null)}
      />

      <CreateOptionsSheet
        visible={createOptionsVisible}
        onClose={() => setCreateOptionsVisible(false)}
        onSelect={handleCreateOptionSelect}
      />

      <FeedActionDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        primaryLabel={dialogState.primaryLabel}
        secondaryLabel={dialogState.secondaryLabel}
        tone={dialogState.tone}
        onPrimary={closeDialog}
      />
    </View>
  );
}
