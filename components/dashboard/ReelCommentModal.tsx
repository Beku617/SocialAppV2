import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addReelComment,
  dislikeReelComment,
  fetchReelComments,
  likeReelComment,
  type ReelCommentType,
} from "../../services/api";

// ─── Helpers ────────────────────────────────────────────────────────────
const timeAgo = (dateStr: string): string => {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}M`;
  return `${Math.floor(day / 365)}y`;
};

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── Types ──────────────────────────────────────────────────────────────
interface ReelCommentModalProps {
  visible: boolean;
  onClose: () => void;
  reelId: string;
  likesCount: number;
  sharesCount: number;
  currentUserName: string;
  currentUserAvatar: string;
  reelAuthorId: string;
  onCommentsCountChange?: (count: number) => void;
}

// ─── Single Comment Row (recursive for replies) ─────────────────────────
function CommentRow({
  comment,
  depth,
  reelId,
  reelAuthorId,
  onReply,
  onUpdateComment,
}: {
  comment: ReelCommentType;
  depth: number;
  reelId: string;
  reelAuthorId: string;
  onReply: (commentId: string, authorName: string) => void;
  onUpdateComment: (commentId: string, updates: Partial<ReelCommentType>) => void;
}) {
  const avatarUri =
    comment.author.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=ddd&color=333`;
  const indent = Math.min(depth, 4) * 28;
  const isReelAuthor = comment.author.id === reelAuthorId;

  const handleLike = async () => {
    const res = await likeReelComment(reelId, comment.id);
    if (res.data) {
      onUpdateComment(comment.id, {
        likedByMe: res.data.liked,
        likesCount: res.data.likesCount,
        dislikedByMe: false,
        dislikesCount: res.data.dislikesCount,
      });
    }
  };

  const handleDislike = async () => {
    const res = await dislikeReelComment(reelId, comment.id);
    if (res.data) {
      onUpdateComment(comment.id, {
        dislikedByMe: res.data.disliked,
        dislikesCount: res.data.dislikesCount,
        likedByMe: false,
        likesCount: res.data.likesCount,
      });
    }
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          paddingLeft: 16 + indent,
          paddingRight: 16,
          paddingVertical: 10,
          borderBottomWidth: depth === 0 ? 0.5 : 0,
          borderBottomColor: "rgba(0,0,0,0.06)",
        }}
      >
        {/* Avatar */}
        <Image
          source={{ uri: avatarUri }}
          style={{
            width: depth === 0 ? 40 : 32,
            height: depth === 0 ? 40 : 32,
            borderRadius: depth === 0 ? 20 : 16,
            marginRight: 10,
            marginTop: 2,
          }}
        />

        <View style={{ flex: 1 }}>
          {/* Name + time + author badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ fontWeight: "700", fontSize: 14, color: "#1a1a1a" }}>
              {comment.author.name}
            </Text>
            <Text style={{ color: "#999", fontSize: 13 }}>
              · {timeAgo(comment.createdAt)}
            </Text>
            {isReelAuthor && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ color: "#999", fontSize: 13 }}>·</Text>
                <Ionicons name="pencil" size={12} color="#2563eb" />
                <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>
                  Author
                </Text>
              </View>
            )}
          </View>

          {/* Comment text */}
          <Text style={{ fontSize: 15, color: "#1a1a1a", lineHeight: 20, marginTop: 3 }}>
            {comment.text}
          </Text>

          {/* Reply button */}
          <TouchableOpacity
            onPress={() => onReply(comment.id, comment.author.name)}
            style={{ marginTop: 5 }}
          >
            <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>
              Reply
            </Text>
          </TouchableOpacity>
        </View>

        {/* Like / Dislike */}
        <View style={{ alignItems: "center", justifyContent: "center", gap: 6 }}>
          <TouchableOpacity onPress={handleLike} activeOpacity={0.6}>
            <Ionicons
              name={comment.likedByMe ? "thumbs-up" : "thumbs-up-outline"}
              size={18}
              color={comment.likedByMe ? "#2563eb" : "#999"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDislike} activeOpacity={0.6}>
            <Ionicons
              name={comment.dislikedByMe ? "thumbs-down" : "thumbs-down-outline"}
              size={18}
              color={comment.dislikedByMe ? "#ef4444" : "#999"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Render nested replies recursively */}
      {comment.replies?.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          reelId={reelId}
          reelAuthorId={reelAuthorId}
          onReply={onReply}
          onUpdateComment={onUpdateComment}
        />
      ))}
    </>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────
export default function ReelCommentModal({
  visible,
  onClose,
  reelId,
  likesCount,
  sharesCount,
  currentUserName,
  currentUserAvatar,
  reelAuthorId,
  onCommentsCountChange,
}: ReelCommentModalProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [comments, setComments] = useState<ReelCommentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const loadComments = useCallback(async () => {
    if (!reelId) return;
    setLoading(true);
    const res = await fetchReelComments(reelId);
    if (res.data) {
      setComments(res.data.comments);
    }
    setLoading(false);
  }, [reelId]);

  useEffect(() => {
    if (visible) {
      loadComments();
      setReplyTo(null);
      setText("");
    }
  }, [visible, loadComments]);

  // Recursively update a comment in the tree
  const updateCommentInTree = (
    list: ReelCommentType[],
    commentId: string,
    updates: Partial<ReelCommentType>,
  ): ReelCommentType[] => {
    return list.map((c) => {
      if (c.id === commentId) return { ...c, ...updates };
      if (c.replies?.length) {
        return { ...c, replies: updateCommentInTree(c.replies, commentId, updates) };
      }
      return c;
    });
  };

  // Recursively insert a new reply into the correct parent
  const insertReplyInTree = (
    list: ReelCommentType[],
    parentId: string,
    newComment: ReelCommentType,
  ): ReelCommentType[] => {
    return list.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), newComment] };
      }
      if (c.replies?.length) {
        return { ...c, replies: insertReplyInTree(c.replies, parentId, newComment) };
      }
      return c;
    });
  };

  const handleUpdateComment = (commentId: string, updates: Partial<ReelCommentType>) => {
    setComments((prev) => updateCommentInTree(prev, commentId, updates));
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ commentId, authorName });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const parentId = replyTo?.commentId || null;
    const res = await addReelComment(reelId, trimmed, parentId);

    if (res.data) {
      const newComment = res.data.comment;
      if (parentId) {
        setComments((prev) => insertReplyInTree(prev, parentId, newComment));
      } else {
        setComments((prev) => [...prev, newComment]);
      }
      onCommentsCountChange?.(res.data.commentsCount);
      setText("");
      setReplyTo(null);
    }
    setSending(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Drag handle */}
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#ccc",
            }}
          />
        </View>

        {/* Header: likes + shares */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="heart" size={18} color="#ef4444" />
            <Text style={{ fontWeight: "700", fontSize: 15, color: "#1a1a1a" }}>
              {likesCount > 0 ? `You + ${formatCount(likesCount)}` : "No likes yet"}
            </Text>
          </View>
          <Text style={{ fontWeight: "600", fontSize: 15, color: "#1a1a1a" }}>
            {formatCount(sharesCount)} shares
          </Text>
        </View>

        {/* Comments list */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#999" />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CommentRow
                comment={item}
                depth={0}
                reelId={reelId}
                reelAuthorId={reelAuthorId}
                onReply={handleReply}
                onUpdateComment={handleUpdateComment}
              />
            )}
            contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
                <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
                <Text style={{ color: "#999", marginTop: 10, fontSize: 14 }}>
                  No comments yet. Be the first!
                </Text>
              </View>
            }
          />
        )}

        {/* Bottom input area */}
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: "#e5e5e5",
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: "#fff",
          }}
        >
          {/* Reply indicator */}
          {replyTo && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 2,
              }}
            >
              <Text style={{ color: "#666", fontSize: 13 }}>
                Replying to {replyTo.authorName}
              </Text>
              <Text style={{ color: "#666", fontSize: 13 }}> · </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Text style={{ color: "#1a1a1a", fontSize: 13, fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: 4,
              gap: 10,
            }}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={`Comment as ${currentUserName}`}
              placeholderTextColor="#aaa"
              style={{
                flex: 1,
                backgroundColor: "#f0f0f0",
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "ios" ? 10 : 8,
                fontSize: 14,
                color: "#1a1a1a",
                maxHeight: 100,
              }}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Ionicons
                  name="send"
                  size={22}
                  color={text.trim() ? "#2563eb" : "#ccc"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
