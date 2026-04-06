import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildPostShareToken,
  deletePost as apiDeletePost,
  isPostSaved,
  reportPost,
  sharePost,
  toggleSavedPost,
  togglePostNotifications,
  toggleLike as apiToggleLike,
  type Post,
  type PostVisibility,
} from "../../services/api";
import FeedActionDialog from "./FeedActionDialog";
import { formatCount, timeAgo } from "./helpers";
import MultiImageGrid from "./MultiImageGrid";
import PostCommentModal from "./PostCommentModal";
import PostOptionsSheet from "./PostOptionsSheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence or dangerous content" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "false_information", label: "False information" },
  { value: "other", label: "Other" },
];
const VISIBILITY_OPTIONS: PostVisibility[] = ["public", "friends", "private"];

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
  onOpenAuthorProfile,
  onPostShared,
  onSnoozeAuthor,
  onHideAuthor,
}: {
  post: Post;
  currentUserId: string | null;
  onLikeToggled: (postId: string, liked: boolean, count: number) => void;
  onRemovePost: (postId: string) => void;
  onHidePost: (postId: string) => void;
  onOpenAuthorProfile: (userId: string) => void;
  onPostShared: (post: Post) => void;
  onSnoozeAuthor: (authorId: string) => void | Promise<void>;
  onHideAuthor: (authorId: string) => void;
}) {
  const insets = useSafeAreaInsets();
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
  const [comments, setComments] = useState(post.comments || []);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
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
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState<string>("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareVisibility, setShareVisibility] = useState<PostVisibility>("public");
  const [shareSubmitting, setShareSubmitting] = useState(false);

  const visibilityIcon = (() => {
    if (post.visibility === "private") return "lock-closed-outline";
    if (post.visibility === "friends") return "people-outline";
    return "globe-outline";
  })();

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
    setComments(Array.isArray(post.comments) ? post.comments : []);
  }, [post.id, post.comments]);

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
    setReportVisible(true);
  };

  const handleSubmitReport = async () => {
    setReportSubmitting(true);
    const result = await reportPost(post.id, reportReason, reportDescription);
    setReportSubmitting(false);

    if (!result.data) {
      openDialog({
        title: "Report failed",
        message: result.error || "Could not submit report right now.",
        primaryLabel: "Close",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    setReportVisible(false);
    setReportDescription("");
    setReportReason("spam");
    openDialog({
      title: "Post reported",
      message: "Thanks. We’ll review this post and keep your report private.",
      primaryLabel: "OK",
      tone: "success",
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
    await Clipboard.setStringAsync(buildPostShareToken(post.id));
    setMenuVisible(false);
    openDialog({
      title: "Link copied",
      message: "The post token is ready to paste and share in-app.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleSharePost = () => {
    setShareText("");
    setShareVisibility("public");
    setShareVisible(true);
  };

  const handleSubmitShare = async () => {
    setShareSubmitting(true);
    const result = await sharePost(post.id, shareText.trim(), shareVisibility);
    setShareSubmitting(false);

    if (!result.data) {
      openDialog({
        title: "Share failed",
        message: result.error || "Could not share this post right now.",
        primaryLabel: "Close",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    setShareVisible(false);
    setShareText("");
    onPostShared(result.data);
    openDialog({
      title: "Post shared",
      message: "Your shared post was added to your feed.",
      primaryLabel: "OK",
      tone: "success",
      onPrimary: closeDialog,
    });
  };

  const handleSnoozeAuthor = async () => {
    setMenuVisible(false);
    try {
      await onSnoozeAuthor(post.author.id);
    } catch {
      openDialog({
        title: "Snooze failed",
        message: "Could not snooze this user right now.",
        primaryLabel: "Close",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }
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
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenAuthorProfile(post.author.id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                  {timeAgo(post.createdAt)}
                </Text>
                <Ionicons name={visibilityIcon as any} size={12} color="#9ca3af" />
                <Text style={{ fontSize: 12, color: "#9ca3af", textTransform: "capitalize" }}>
                  {post.visibility}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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

          {post.sharedPost ? (
            <View
              style={{
                marginTop: post.text ? 10 : 0,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#334155",
                overflow: "hidden",
                backgroundColor: "#111827",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => onOpenAuthorProfile(post.sharedPost!.author.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 10,
                  paddingTop: 10,
                  paddingBottom: 8,
                }}
              >
                <Image
                  source={{
                    uri:
                      post.sharedPost.author.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(post.sharedPost.author.name)}&background=4f46e5&color=fff`,
                  }}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "700", color: "#f9fafb" }}
                  >
                    {post.sharedPost.author.name}
                  </Text>
                </View>
              </TouchableOpacity>

              {post.sharedPost.text ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: "#e2e8f0",
                    lineHeight: 19,
                    paddingHorizontal: 10,
                    paddingBottom: 8,
                  }}
                >
                  {post.sharedPost.text}
                </Text>
              ) : null}

              {post.sharedPost.imageUrls.length > 0 ? (
                <MultiImageGrid
                  images={post.sharedPost.imageUrls}
                  height={SCREEN_WIDTH * 0.6}
                  borderRadius={0}
                  singleImageResizeMode="cover"
                  multiImageResizeMode="contain"
                />
              ) : null}
            </View>
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
              onPress={() => setCommentsVisible(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#9ca3af" />
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#9ca3af" }}>
                {formatCount(comments.length)}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSharePost}>
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
        onToggleSaved={handleToggleSaved}
        onHidePost={handleHidePost}
        onReportPost={handleReportPost}
        onToggleNotifications={handleToggleNotifications}
        onCopyLink={handleCopyLink}
        onSnoozeAuthor={() => void handleSnoozeAuthor()}
        onHideAuthor={handleHideAuthor}
      />

      <Modal
        visible={reportVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setReportVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(17, 24, 39, 0.36)",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() => setReportVisible(false)}
          />

          <View
            style={{
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 18,
              maxHeight: "82%",
            }}
          >
            <View
              style={{
                width: 56,
                height: 6,
                borderRadius: 999,
                backgroundColor: "#9ca3af",
                alignSelf: "center",
                marginBottom: 14,
              }}
            />

            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>
              Report post
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 19,
              }}
            >
              Choose a reason and add optional details.
            </Text>

            <ScrollView
              style={{ marginTop: 14 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {REPORT_REASONS.map((reason) => {
                const active = reason.value === reportReason;
                return (
                  <TouchableOpacity
                    key={reason.value}
                    onPress={() => setReportReason(reason.value)}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? "#111827" : "#e5e7eb",
                      backgroundColor: active ? "#f9fafb" : "#ffffff",
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? "700" : "600",
                        color: "#111827",
                      }}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <View style={{ marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Optional description
                </Text>
                <TextInput
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholder="Add more details (optional)"
                  placeholderTextColor="#9ca3af"
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  style={{
                    minHeight: 96,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: "#111827",
                    lineHeight: 20,
                  }}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setReportVisible(false)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 13,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                }}
              >
                <Text style={{ color: "#374151", fontSize: 14, fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={reportSubmitting}
                onPress={() => void handleSubmitReport()}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: "#111827",
                  opacity: reportSubmitting ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
                  {reportSubmitting ? "Submitting..." : "Submit report"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={shareVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShareVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 24}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(17, 24, 39, 0.36)",
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ flex: 1 }}
              onPress={() => setShareVisible(false)}
            />

            <View
              style={{
                backgroundColor: "#ffffff",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 12),
                marginBottom: Platform.OS === "android" ? 24 : 8,
                maxHeight: "84%",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "#9ca3af",
                  alignSelf: "center",
                  marginBottom: 14,
                }}
              />

              <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>
                Share post
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#6b7280",
                  lineHeight: 19,
                }}
              >
                Add an optional caption for your shared post.
              </Text>

              <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
                {VISIBILITY_OPTIONS.map((option) => {
                  const selected = shareVisibility === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setShareVisibility(option)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? "#4f46e5" : "#d1d5db",
                        backgroundColor: selected ? "#eef2ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: selected ? "#4338ca" : "#6b7280",
                          fontWeight: selected ? "700" : "500",
                          textTransform: "capitalize",
                        }}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 12 }}>
                <TextInput
                  value={shareText}
                  onChangeText={setShareText}
                  placeholder="Write something about this post..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  maxLength={2200}
                  textAlignVertical="top"
                  style={{
                    minHeight: 96,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: "#111827",
                    lineHeight: 20,
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => setShareVisible(false)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 13,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                  }}
                >
                  <Text style={{ color: "#374151", fontSize: 14, fontWeight: "700" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={shareSubmitting}
                  onPress={() => void handleSubmitShare()}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: "#111827",
                    opacity: shareSubmitting ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
                    {shareSubmitting ? "Sharing..." : "Share"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

      <PostCommentModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        postId={post.id}
        comments={comments}
        onCommentsUpdated={setComments}
      />
    </>
  );
}
