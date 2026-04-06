import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
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
  createAdminReel,
  deleteAdminReel,
  fetchAdminReelDetails,
  fetchAdminReels,
  type AdminReel,
  type ReelVisibility,
} from "../../services/api";
import { timeAgo } from "../dashboard/helpers";
import AdminConfirmDialog, { type AdminDialogTone } from "./AdminConfirmDialog";

const VISIBILITY_OPTIONS: ReelVisibility[] = ["public", "friends", "private"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const formatDuration = (seconds?: number | null) => {
  if (!Number.isFinite(seconds) || !seconds || seconds <= 0) return "0:00";
  const totalSeconds = Math.floor(Number(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

type NoticeDialogState = {
  tone: AdminDialogTone;
  title: string;
  message: string;
};

type SelectedVideoState = {
  uri: string;
  fileName: string;
  mimeType: string;
  duration: number;
  width: number;
  height: number;
};

type AdminReelsSectionProps = {
  onDataChanged: () => void | Promise<void>;
};

export default function AdminReelsSection({
  onDataChanged,
}: AdminReelsSectionProps) {
  const [reels, setReels] = useState<AdminReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionReelId, setActionReelId] = useState<string | null>(null);

  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState("");
  const [visibility, setVisibility] = useState<ReelVisibility>("public");
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideoState | null>(
    null,
  );

  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<AdminReel | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminReel | null>(null);
  const [noticeDialog, setNoticeDialog] = useState<NoticeDialogState | null>(
    null,
  );

  const showNotice = useCallback(
    (tone: AdminDialogTone, title: string, message: string) => {
      setNoticeDialog({ tone, title, message });
    },
    [],
  );

  const loadReels = useCallback(async () => {
    const result = await fetchAdminReels();

    if (result.error) {
      showNotice("warning", "Reels", result.error);
      setLoading(false);
      return;
    }

    setReels(result.data || []);
    setLoading(false);
  }, [showNotice]);

  useEffect(() => {
    void loadReels();
  }, [loadReels]);

  const refreshAll = useCallback(async () => {
    await loadReels();
    await Promise.resolve(onDataChanged());
  }, [loadReels, onDataChanged]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handlePickVideo = useCallback(async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      showNotice(
        "warning",
        "Permission needed",
        "Please allow gallery access to create a reel.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setSelectedVideo({
      uri: asset.uri || "",
      fileName: asset.fileName || "admin-reel.mp4",
      mimeType: asset.mimeType || "video/mp4",
      duration: Math.floor((asset.duration || 0) / 1000),
      width: asset.width || 0,
      height: asset.height || 0,
    });
  }, [showNotice]);

  const handleCreateReel = useCallback(async () => {
    if (!selectedVideo?.uri) {
      showNotice("default", "Create reel", "Choose a video first.");
      return;
    }

    setSubmitting(true);
    const result = await createAdminReel({
      caption: caption.trim(),
      music: music.trim(),
      visibility,
      fileUri: selectedVideo.uri,
      fileName: selectedVideo.fileName,
      mimeType: selectedVideo.mimeType,
      duration: selectedVideo.duration,
      width: selectedVideo.width,
      height: selectedVideo.height,
    });
    setSubmitting(false);

    if (result.error) {
      showNotice("warning", "Create reel", result.error);
      return;
    }

    setCaption("");
    setMusic("");
    setVisibility("public");
    setSelectedVideo(null);
    showNotice(
      "success",
      "Reel created",
      "The reel has been published successfully.",
    );
    await refreshAll();
  }, [caption, music, refreshAll, selectedVideo, showNotice, visibility]);

  const handleViewReel = useCallback(
    async (reelId: string) => {
      setSelectedReelId(reelId);
      setSelectedReel(null);
      setDetailsLoading(true);

      const result = await fetchAdminReelDetails(reelId);
      setDetailsLoading(false);

      if (result.error) {
        showNotice("warning", "Reel details", result.error);
        return;
      }

      setSelectedReel(result.data || null);
    },
    [showNotice],
  );

  const handleDeleteReel = useCallback(async () => {
    if (!deleteTarget) return;

    setActionReelId(deleteTarget.id);
    const result = await deleteAdminReel(deleteTarget.id);
    setActionReelId(null);

    if (result.error) {
      showNotice("warning", "Delete reel", result.error);
      return;
    }

    showNotice(
      "success",
      "Reel deleted",
      "The reel has been removed successfully.",
    );

    if (selectedReelId === deleteTarget.id) {
      setSelectedReelId(null);
      setSelectedReel(null);
    }

    setDeleteTarget(null);
    await refreshAll();
  }, [deleteTarget, refreshAll, selectedReelId, showNotice]);

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
              Create reel
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 20 }}>
              Create, view, and delete reels here. Editing existing reels is
              intentionally disabled in both the UI and API.
            </Text>
          </View>

          <TextInput
            multiline
            placeholder="Write a caption"
            placeholderTextColor="#9ca3af"
            value={caption}
            onChangeText={setCaption}
            style={{
              minHeight: 96,
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

          <TextInput
            placeholder="Music or audio title"
            placeholderTextColor="#9ca3af"
            value={music}
            onChangeText={setMusic}
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              paddingHorizontal: 14,
              paddingVertical: 14,
              fontSize: 15,
              color: "#111827",
            }}
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            {VISIBILITY_OPTIONS.map((option) => {
              const selected = option === visibility;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => setVisibility(option)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? "#111827" : "#d1d5db",
                    backgroundColor: selected ? "#111827" : "#ffffff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: selected ? "#ffffff" : "#6b7280",
                      textTransform: "capitalize",
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => void handlePickVideo()}
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
              <Ionicons name="film-outline" size={18} color="#111827" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
                Choose video
              </Text>
            </TouchableOpacity>

            {selectedVideo ? (
              <TouchableOpacity
                onPress={() => setSelectedVideo(null)}
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
                  Clear video
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedVideo ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 13, color: "#6b7280" }}>
                {selectedVideo.fileName} • {formatDuration(selectedVideo.duration)}
              </Text>
              <View
                style={{
                  overflow: "hidden",
                  borderRadius: 20,
                  backgroundColor: "#111827",
                }}
              >
                <Video
                  source={{ uri: selectedVideo.uri }}
                  style={{ width: "100%", height: 250 }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay={false}
                />
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            disabled={submitting}
            onPress={() => void handleCreateReel()}
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
                Publish reel
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
          {reels.map((reel, index) => {
            const previewImage = reel.thumbUrl;
            const isBusy = actionReelId === reel.id;

            return (
              <View
                key={reel.id}
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
                      height: 96,
                      borderRadius: 18,
                      overflow: "hidden",
                      backgroundColor: "#111827",
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
                      <View style={{ alignItems: "center", gap: 6 }}>
                        <Ionicons
                          name="play-circle-outline"
                          size={26}
                          color="#d1d5db"
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: "#d1d5db",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Reel
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
                        Reel
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
                      {reel.caption || "Untitled reel"}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Author: {reel.author.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Created: {formatDateTime(reel.createdAt)}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Visibility: {reel.visibility}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Status: {reel.status} • Duration: {formatDuration(reel.duration)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => void handleViewReel(reel.id)}
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
                    onPress={() => setDeleteTarget(reel)}
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
        title="Delete reel"
        message="Delete this reel permanently? This action cannot be undone."
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimary={() => void handleDeleteReel()}
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
        visible={selectedReelId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedReelId(null);
          setSelectedReel(null);
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
              Reel details
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedReelId(null);
                setSelectedReel(null);
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
                  {selectedReel?.status}
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {selectedReel?.caption || "Video reel"}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Author: {selectedReel?.author.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Created: {formatDateTime(selectedReel?.createdAt)}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Visibility: {selectedReel?.visibility}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Duration: {formatDuration(selectedReel?.duration)}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Likes: {selectedReel?.likesCount ?? 0} • Comments:{" "}
                  {selectedReel?.commentsCount ?? 0} • Views:{" "}
                  {selectedReel?.viewsCount ?? 0}
                </Text>
              </View>

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
                {selectedReel?.playbackUrl ? (
                  <View
                    style={{
                      overflow: "hidden",
                      borderRadius: 20,
                      backgroundColor: "#111827",
                    }}
                  >
                    <Video
                      source={{ uri: selectedReel.playbackUrl }}
                      style={{ width: "100%", height: 320 }}
                      resizeMode={ResizeMode.CONTAIN}
                      useNativeControls
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      height: 220,
                      borderRadius: 20,
                      backgroundColor: "#111827",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={54}
                      color="#d1d5db"
                    />
                    <Text style={{ color: "#d1d5db", fontSize: 14 }}>
                      No playback URL available
                    </Text>
                  </View>
                )}
              </View>

              {selectedReel?.music ? (
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
                    Music
                  </Text>
                  <Text style={{ fontSize: 15, color: "#374151", lineHeight: 22 }}>
                    {selectedReel.music}
                  </Text>
                </View>
              ) : null}

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
                  Timeline
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Created {selectedReel ? timeAgo(selectedReel.createdAt) : ""}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Updated {selectedReel ? timeAgo(selectedReel.updatedAt) : ""}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
