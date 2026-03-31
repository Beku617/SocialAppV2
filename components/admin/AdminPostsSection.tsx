import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createAdminPost,
  deleteAdminPost,
  fetchAdminPostDetails,
  fetchAdminPosts,
  type AdminPost,
} from "../../services/api";
import MultiImageGrid from "../dashboard/MultiImageGrid";
import { timeAgo } from "../dashboard/helpers";
import AdminConfirmDialog, { type AdminDialogTone } from "./AdminConfirmDialog";

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const getPostTypeLabel = (post: AdminPost) => {
  const hasMedia = Array.isArray(post.imageUrls) && post.imageUrls.length > 0;
  const hasText = typeof post.caption === "string" && post.caption.trim().length > 0;

  if (hasMedia && hasText) return "Text + media";
  if (hasMedia) return "Media only";
  return "Text only";
};

type AdminPostsSectionProps = {
  onDataChanged: () => void | Promise<void>;
};

type NoticeDialogState = {
  tone: AdminDialogTone;
  title: string;
  message: string;
};

export default function AdminPostsSection({
  onDataChanged,
}: AdminPostsSectionProps) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionPostId, setActionPostId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
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

  const loadPosts = useCallback(async () => {
    const result = await fetchAdminPosts();

    if (result.error) {
      showNotice("warning", "Posts", result.error);
      setLoading(false);
      return;
    }

    setPosts(result.data || []);
    setLoading(false);
  }, [showNotice]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const refreshAll = useCallback(async () => {
    await loadPosts();
    await Promise.resolve(onDataChanged());
  }, [loadPosts, onDataChanged]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handlePickImages = useCallback(async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      showNotice(
        "warning",
        "Permission needed",
        "Please allow gallery access to create a post.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: 10,
      quality: 0.35,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const nextImages = result.assets
      .map((asset) => {
        const mime = asset.mimeType || "image/jpeg";
        return asset.base64
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri || "";
      })
      .filter((value) => value.length > 0);

    setSelectedImages(nextImages);
  }, [showNotice]);

  const handleCreatePost = useCallback(async () => {
    if (!text.trim() && selectedImages.length === 0) {
      showNotice("default", "Create post", "Add text or at least one image.");
      return;
    }

    setSubmitting(true);
    const result = await createAdminPost(text.trim(), selectedImages);
    setSubmitting(false);

    if (result.error) {
      showNotice("warning", "Create post", result.error);
      return;
    }

    setText("");
    setSelectedImages([]);
    showNotice(
      "success",
      "Post created",
      "The post has been published successfully.",
    );
    await refreshAll();
  }, [refreshAll, selectedImages, showNotice, text]);

  const handleViewPost = useCallback(async (postId: string) => {
    setSelectedPostId(postId);
    setSelectedPost(null);
    setDetailsLoading(true);

    const result = await fetchAdminPostDetails(postId);
    setDetailsLoading(false);

    if (result.error) {
      showNotice("warning", "Post details", result.error);
      return;
    }

    setSelectedPost(result.data || null);
  }, [showNotice]);

  const handleDeletePost = useCallback(async () => {
    if (!deleteTarget) return;

    setActionPostId(deleteTarget.id);
    const result = await deleteAdminPost(deleteTarget.id);
    setActionPostId(null);

    if (result.error) {
      showNotice("warning", "Delete post", result.error);
      return;
    }

    showNotice(
      "success",
      "Post deleted",
      "The post has been removed successfully.",
    );
    if (selectedPostId === deleteTarget.id) {
      setSelectedPostId(null);
      setSelectedPost(null);
    }
    setDeleteTarget(null);
    await refreshAll();
  }, [deleteTarget, refreshAll, selectedPostId, showNotice]);

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
        contentContainerStyle={{ paddingBottom: 36, gap: 18 }}
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
            padding: 18,
            gap: 14,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
              Create post
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 20 }}>
              Create, view, and delete posts here. Editing existing posts is
              intentionally disabled in both the UI and API.
            </Text>
          </View>

          <TextInput
            multiline
            placeholder="Write a caption or post text"
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            style={{
              minHeight: 110,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              paddingHorizontal: 14,
              paddingVertical: 14,
              fontSize: 15,
              color: "#111827",
              textAlignVertical: "top",
            }}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => void handlePickImages()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#f3f4f6",
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 16,
              }}
            >
              <Ionicons name="images-outline" size={18} color="#111827" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
                Add images
              </Text>
            </TouchableOpacity>

            {selectedImages.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSelectedImages([])}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: "#fee2e2",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#b91c1c" }}
                >
                  Clear media
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedImages.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 13, color: "#6b7280" }}>
                {selectedImages.length} image
                {selectedImages.length === 1 ? "" : "s"} selected
              </Text>
              <MultiImageGrid
                images={selectedImages}
                height={250}
                borderRadius={20}
                viewerTitle="Admin preview"
                viewerSubtitle="Draft"
                viewerShowPostChrome
              />
            </View>
          ) : null}

          <TouchableOpacity
            disabled={submitting}
            onPress={() => void handleCreatePost()}
            style={{
              backgroundColor: "#111827",
              alignItems: "center",
              borderRadius: 18,
              paddingVertical: 14,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#ffffff" }}
              >
                Publish post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {posts.map((post, index) => {
            const previewImage = post.imageUrls?.[0] || post.imageUrl;
            const isBusy = actionPostId === post.id;
            const postTypeLabel = getPostTypeLabel(post);

            return (
              <View
                key={post.id}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: "#f3f4f6",
                  gap: 14,
                }}
              >
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      overflow: "hidden",
                      backgroundColor: "#e5e7eb",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {previewImage ? (
                      <Image
                        source={{ uri: previewImage }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ alignItems: "center", gap: 4 }}>
                        <Ionicons
                          name="document-text-outline"
                          size={22}
                          color="#6b7280"
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          Text
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 6 }}>
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#f3f4f6",
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#374151",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                        }}
                      >
                        {postTypeLabel}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {post.caption || "Untitled post"}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Author: {post.author.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Created: {formatDateTime(post.createdAt)}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Status: {post.status}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => void handleViewPost(post.id)}
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

                  <TouchableOpacity
                    disabled={isBusy}
                    onPress={() => setDeleteTarget(post)}
                    style={{
                      backgroundColor: "#fee2e2",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {isBusy ? "Working..." : "Delete"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AdminConfirmDialog
        visible={deleteTarget !== null}
        tone="danger"
        title="Delete post"
        message="Delete this post permanently? This action cannot be undone."
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimary={() => void handleDeletePost()}
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
        visible={selectedPostId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedPostId(null);
          setSelectedPost(null);
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
              Post details
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedPostId(null);
                setSelectedPost(null);
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
                    fontSize: 14,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {selectedPost?.status}
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {selectedPost?.caption || "Image post"}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Author: {selectedPost?.author.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Created: {formatDateTime(selectedPost?.createdAt)}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Likes: {selectedPost?.likeCount ?? 0} • Comments:{" "}
                  {selectedPost?.commentCount ?? 0}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Type: {selectedPost ? getPostTypeLabel(selectedPost) : "N/A"}
                </Text>
              </View>

              {selectedPost?.imageUrls.length ? (
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 24,
                    padding: 18,
                    gap: 12,
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}
                  >
                    Media
                  </Text>
                  <MultiImageGrid
                    images={selectedPost.imageUrls}
                    height={280}
                    borderRadius={20}
                    viewerTitle={selectedPost.author.name}
                    viewerSubtitle={timeAgo(selectedPost.createdAt).toUpperCase()}
                    viewerShowPostChrome
                  />
                </View>
              ) : null}

              {selectedPost?.caption ? (
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 24,
                    padding: 18,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}
                  >
                    Caption
                  </Text>
                  <Text style={{ fontSize: 15, color: "#374151", lineHeight: 22 }}>
                    {selectedPost.caption}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
