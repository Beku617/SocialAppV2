import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deletePost as apiDeletePost,
  isPostSaved,
  toggleSavedPost,
  togglePostNotifications,
  toggleLike as apiToggleLike,
  type Post,
} from "../../services/api";
import { BASE_URL } from "../../services/config";
import FeedActionDialog from "./FeedActionDialog";
import { formatCount, timeAgo } from "./helpers";
import MultiImageGrid from "./MultiImageGrid";
import PostOptionsSheet from "./PostOptionsSheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Create Post Bar ────────────────────────────────────────────────────
export function CreatePostBar({
  avatarUrl,
  userName,
}: {
  avatarUrl: string;
  userName: string;
}) {
  return (
    <View style={{ paddingHorizontal: 0, marginTop: 2, marginBottom: 6 }}>
      <View
        style={{
          backgroundColor: "#0b1220",
          borderRadius: 0,
          padding: 12,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#1f2937",
        }}
      >
        <Image
          source={{
            uri:
              avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`,
          }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
        />
        <TextInput
          style={{
            flex: 1,
            fontSize: 14,
            color: "#d1d5db",
          }}
          placeholder="What's inspiring you?"
          placeholderTextColor="#6b7280"
          editable={false}
        />
        <TouchableOpacity
          style={{
            padding: 8,
            borderRadius: 12,
          }}
        >
          <Ionicons name="image-outline" size={22} color="#4f46e5" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Post Card ──────────────────────────────────────────────────────────
export default function PostCard({
  post,
  currentUserId,
  onLikeToggled,
  onRemovePost,
  onHidePost,
  onHideAuthor,
}: {
  post: Post;
  currentUserId: string | null;
  onLikeToggled: (postId: string, liked: boolean, count: number) => void;
  onRemovePost: (postId: string) => void;
  onHidePost: (postId: string) => void;
  onHideAuthor: (authorId: string) => void;
}) {
  const imageUrls =
    Array.isArray(post.imageUrls) && post.imageUrls.length > 0
      ? post.imageUrls
      : post.imageUrl
        ? [post.imageUrl]
        : [];
  const isOwner = currentUserId === post.author.id;
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [menuVisible, setMenuVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    post.notificationsEnabled ?? true,
  );
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    primaryLabel: string;
    secondaryLabel?: string;
    tone?: "default" | "success" | "danger" | "warning";
    onPrimary?: () => void;
    onSecondary?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    primaryLabel: "OK",
  });

  const closeDialog = () =>
    setDialogState((prev) => ({
      ...prev,
      visible: false,
      onPrimary: undefined,
      onSecondary: undefined,
    }));

  const openDialog = ({
    title,
    message,
    primaryLabel = "OK",
    secondaryLabel,
    tone = "default",
    onPrimary,
    onSecondary,
  }: {
    title: string;
    message: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    tone?: "default" | "success" | "danger" | "warning";
    onPrimary?: () => void;
    onSecondary?: () => void;
  }) => {
    setDialogState({
      visible: true,
      title,
      message,
      primaryLabel,
      secondaryLabel,
      tone,
      onPrimary,
      onSecondary,
    });
  };

  useEffect(() => {
    setNotificationsEnabled(post.notificationsEnabled ?? true);
  }, [post.id, post.notificationsEnabled]);

  useEffect(() => {
    let mounted = true;

    isPostSaved(post.id).then((value) => {
      if (mounted) {
        setSaved(value);
      }
    });

    return () => {
      mounted = false;
    };
  }, [post.id]);

  const handleLike = async () => {
    const prev = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    const { data, error } = await apiToggleLike(post.id);
    if (error) {
      setLiked(prev);
      setLikeCount(prevCount);
    } else if (data) {
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      onLikeToggled(post.id, data.liked, data.likeCount);
    }
  };

  const handleEditPost = () => {
    setMenuVisible(false);
    router.push({
      pathname: "/edit-post/[postId]",
      params: { postId: post.id },
    });
  };

  const handleDeletePost = () => {
    setMenuVisible(false);
    openDialog({
      title: "Delete post?",
      message: "This will permanently remove the post from your profile and feed.",
      primaryLabel: "Delete",
      secondaryLabel: "Cancel",
      tone: "danger",
      onPrimary: async () => {
        closeDialog();
        const { error } = await apiDeletePost(post.id);
        if (error) {
          openDialog({
            title: "Delete failed",
            message: error,
            primaryLabel: "Close",
            tone: "warning",
            onPrimary: closeDialog,
          });
          return;
        }

        onRemovePost(post.id);
      },
      onSecondary: closeDialog,
    });
  };

  const handleInterested = () => {
    setMenuVisible(false);
    openDialog({
      title: "Preference updated",
      message: "We’ll try to show you more posts like this.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleNotInterested = () => {
    setMenuVisible(false);
    openDialog({
      title: "Preference updated",
      message: "We’ll try to show you fewer posts like this.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleToggleSaved = async () => {
    setMenuVisible(false);
    const nextSaved = await toggleSavedPost(post.id);
    setSaved(nextSaved);
    openDialog({
      title: nextSaved ? "Post saved" : "Removed from saved",
      message: nextSaved
        ? "This post was added to your saved items."
        : "This post was removed from your saved items.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleHidePost = () => {
    setMenuVisible(false);
    onHidePost(post.id);
  };

  const handleReportPost = () => {
    setMenuVisible(false);
    openDialog({
      title: "Post reported",
      message: "Thanks. We’ll review this post and keep your report private.",
      primaryLabel: "OK",
      tone: "warning",
      onPrimary: closeDialog,
    });
  };

  const handleToggleNotifications = async () => {
    if (!isOwner) {
      const nextEnabled = !notificationsEnabled;
      setNotificationsEnabled(nextEnabled);
      setMenuVisible(false);
      openDialog({
        title: nextEnabled ? "Notifications on" : "Notifications off",
        message: nextEnabled
          ? "You’ll get updates when people interact with this post."
          : "You’ll stop getting updates for this post.",
        primaryLabel: "OK",
        tone: "success",
        onPrimary: closeDialog,
      });
      return;
    }

    setMenuVisible(false);
    const result = await togglePostNotifications(post.id);
    if (!result.data) {
      openDialog({
        title: "Update failed",
        message: result.error || "Failed to update post notifications.",
        primaryLabel: "Close",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    const nextEnabled = result.data.notificationsEnabled;
    setNotificationsEnabled(nextEnabled);
    openDialog({
      title: "Notification preference updated",
      message: nextEnabled
        ? "Updates for this post will appear in your Notifications page only."
        : "Updates for this post will appear in your Notifications page and lock screen.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`${BASE_URL}/posts/${post.id}`);
    setMenuVisible(false);
    openDialog({
      title: "Link copied",
      message: "The post link is ready to paste and share.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleSnoozeAuthor = () => {
    setMenuVisible(false);
    openDialog({
      title: `Snoozed ${post.author.name}`,
      message: "Posts from this person will be hidden for the next 30 days.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleHideAuthor = () => {
    setMenuVisible(false);
    onHideAuthor(post.author.id);
  };

  return (
    <>
      <View
        style={{
          backgroundColor: "#0b1220",
          borderRadius: 0,
          marginHorizontal: 0,
          marginBottom: 6,
          overflow: "hidden",
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#1f2937",
        }}
      >
        {/* Header */}
        <View
          style={{
            padding: 12,
            paddingHorizontal: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={{
                uri:
                  post.author.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=4f46e5&color=fff`,
              }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <View>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", color: "#f9fafb" }}
              >
                {post.author.name}
              </Text>
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                {timeAgo(post.createdAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: imageUrls.length > 0 ? 10 : 12,
          }}
        >
          {post.text ? (
            <Text
              style={{
                fontSize: 14,
                color: "#d1d5db",
                lineHeight: 21,
              }}
            >
              {post.text}
            </Text>
          ) : null}
        </View>

        {/* Image */}
        {imageUrls.length > 0 ? (
          <View>
            <MultiImageGrid
              images={imageUrls}
              height={SCREEN_WIDTH * 0.74}
              borderRadius={0}
              singleImageResizeMode="cover"
              multiImageResizeMode="contain"
              viewerTitle={post.author.name}
              viewerSubtitle={timeAgo(post.createdAt).toUpperCase()}
              viewerShowPostChrome
            />
          </View>
        ) : null}

        {/* Actions */}
        <View
          style={{
            padding: 12,
            paddingHorizontal: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: 20 }}>
            <TouchableOpacity
              onPress={handleLike}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? "#ef4444" : "#9ca3af"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: liked ? "#ef4444" : "#9ca3af",
                }}
              >
                {formatCount(likeCount)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#9ca3af" />
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#9ca3af" }}>
                {formatCount(post.comments.length)}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={22} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      <PostOptionsSheet
        visible={menuVisible}
        isOwner={isOwner}
        authorName={post.author.name}
        saved={saved}
        notificationsEnabled={notificationsEnabled}
        onClose={() => setMenuVisible(false)}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
        onInterested={handleInterested}
        onNotInterested={handleNotInterested}
        onToggleSaved={handleToggleSaved}
        onHidePost={handleHidePost}
        onReportPost={handleReportPost}
        onToggleNotifications={handleToggleNotifications}
        onCopyLink={handleCopyLink}
        onSnoozeAuthor={handleSnoozeAuthor}
        onHideAuthor={handleHideAuthor}
      />

      <FeedActionDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        primaryLabel={dialogState.primaryLabel}
        secondaryLabel={dialogState.secondaryLabel}
        tone={dialogState.tone}
        onPrimary={dialogState.onPrimary || closeDialog}
        onSecondary={dialogState.onSecondary}
      />
    </>
  );
}
