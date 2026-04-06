import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import FeedActionDialog from "../../components/dashboard/FeedActionDialog";
import {
  fetchReelDetails,
  getMe,
  getUser,
  markReelReady,
  uploadReelVideoLocal,
  updateReel,
  type ReelVisibility,
} from "../../services/api";

const VISIBILITY_OPTIONS: ReelVisibility[] = ["public", "friends", "private"];

const formatDuration = (durationMs: number) => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "00:00";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function EditReelScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reelId?: string | string[] }>();
  const reelId = Array.isArray(params.reelId) ? params.reelId[0] : params.reelId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState("");
  const [visibility, setVisibility] = useState<ReelVisibility>("public");
  const [thumbUrl, setThumbUrl] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [videoFileName, setVideoFileName] = useState("reel.mp4");
  const [videoMimeType, setVideoMimeType] = useState("video/mp4");
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [userName, setUserName] = useState("You");
  const [userAvatar, setUserAvatar] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
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
    let mounted = true;

    const loadReel = async () => {
      if (!reelId) {
        openDialog({
          title: "Reel unavailable",
          message: "We couldn't find the reel you want to edit.",
          primaryLabel: "Back",
          tone: "warning",
          onPrimary: () => {
            closeDialog();
            router.back();
          },
        });
        setLoading(false);
        return;
      }

      const meResult = await getMe();
      const cachedUser = meResult.data ? null : await getUser();
      const reelResult = await fetchReelDetails(reelId);

      if (!mounted) return;

      const meId = meResult.data?.id || cachedUser?.id || null;
      setCurrentUserId(meId);
      setUserName(meResult.data?.name || cachedUser?.name || "You");
      setUserAvatar(meResult.data?.avatarUrl || cachedUser?.avatarUrl || "");

      if (!reelResult.data) {
        openDialog({
          title: "Reel unavailable",
          message: reelResult.error || "We couldn't load this reel.",
          primaryLabel: "Back",
          tone: "warning",
          onPrimary: () => {
            closeDialog();
            router.back();
          },
        });
        setLoading(false);
        return;
      }

      setCaption(reelResult.data.caption || "");
      setMusic(reelResult.data.music || "");
      setVisibility(reelResult.data.visibility || "public");
      setThumbUrl(reelResult.data.thumbUrl || "");
      setAuthorId(reelResult.data.author.id);
      setLoading(false);

      if (meId && reelResult.data.author.id !== meId) {
        openDialog({
          title: "Editing not allowed",
          message: "You can edit only your own reels.",
          primaryLabel: "Back",
          tone: "warning",
          onPrimary: () => {
            closeDialog();
            router.back();
          },
        });
      }
    };

    void loadReel();

    return () => {
      mounted = false;
    };
  }, [reelId]);

  const canSave = useMemo(() => !saving && !loading, [loading, saving]);

  const avatarUri =
    userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`;

  const handleSave = async () => {
    if (!reelId) return;
    if (authorId && currentUserId && authorId !== currentUserId) {
      openDialog({
        title: "Editing not allowed",
        message: "You can edit only your own reels.",
        primaryLabel: "Back",
        tone: "warning",
        onPrimary: () => {
          closeDialog();
          router.back();
        },
      });
      return;
    }

    setSaving(true);

    if (videoUri) {
      const uploaded = await uploadReelVideoLocal(reelId, {
        fileUri: videoUri,
        mimeType: videoMimeType,
        fileName: videoFileName,
      });

      if (!uploaded.data) {
        setSaving(false);
        openDialog({
          title: "Video update failed",
          message: uploaded.error || "Could not upload replacement video.",
          primaryLabel: "OK",
          tone: "warning",
          onPrimary: closeDialog,
        });
        return;
      }

      const ready = await markReelReady(reelId, {
        playbackUrl: uploaded.data.videoUrl,
        thumbUrl: thumbUrl || undefined,
        music: music.trim(),
        duration: videoDurationMs > 0 ? Math.floor(videoDurationMs / 1000) : undefined,
        width: 1080,
        height: 1920,
      });

      if (!ready.data) {
        setSaving(false);
        openDialog({
          title: "Video update failed",
          message: ready.error || "Could not finalize replacement video.",
          primaryLabel: "OK",
          tone: "warning",
          onPrimary: closeDialog,
        });
        return;
      }
    }

    const result = await updateReel(reelId, {
      caption: caption.trim(),
      music: music.trim(),
      visibility,
    });
    setSaving(false);

    if (!result.data) {
      openDialog({
        title: "Save failed",
        message: result.error || "We couldn't update your reel.",
        primaryLabel: "OK",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    router.replace("/(dashboard)/videos");
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      openDialog({
        title: "Permission needed",
        message: "Please allow gallery access to replace your reel video.",
        primaryLabel: "OK",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setVideoUri(asset.uri || "");
    setVideoFileName(asset.fileName || "reel.mp4");
    setVideoMimeType(asset.mimeType || "video/mp4");
    setVideoDurationMs(asset.duration || 0);
  };

  const handleRecordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      openDialog({
        title: "Permission needed",
        message: "Please allow camera access to record a replacement video.",
        primaryLabel: "OK",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setVideoUri(asset.uri || "");
    setVideoFileName(asset.fileName || "reel.mp4");
    setVideoMimeType(asset.mimeType || "video/mp4");
    setVideoDurationMs(asset.duration || 0);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 18,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#111827",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#f9fafb" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#f9fafb" }}>
          Edit Reel
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={{
            backgroundColor: canSave ? "#4f46e5" : "#2e3350",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 18,
            minWidth: 74,
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 34 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#f9fafb" }}>
                {userName}
              </Text>
              <Text style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)} reel
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>
            Visibility
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {VISIBILITY_OPTIONS.map((option) => {
              const selected = option === visibility;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => setVisibility(option)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? "#1d4ed8" : "#374151",
                    backgroundColor: selected ? "#1d4ed8" : "#111827",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: selected ? "#dbeafe" : "#9ca3af",
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

          <Text style={{ fontSize: 14, color: "#9ca3af", marginBottom: 6 }}>
            Caption
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a reel caption..."
            placeholderTextColor="#9ca3af"
            multiline
            style={{
              minHeight: 90,
              borderWidth: 1,
              borderColor: "#1f2937",
              backgroundColor: "#0b1220",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: "#f9fafb",
              textAlignVertical: "top",
            }}
          />

          <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 16, marginBottom: 6 }}>
            Music
          </Text>
          <TextInput
            value={music}
            onChangeText={setMusic}
            placeholder="Song name or audio title"
            placeholderTextColor="#9ca3af"
            style={{
              borderWidth: 1,
              borderColor: "#1f2937",
              backgroundColor: "#0b1220",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: "#f9fafb",
            }}
          />

          <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 16, marginBottom: 8 }}>
            Preview
          </Text>
          {thumbUrl ? (
            <Image
              source={{ uri: thumbUrl }}
              style={{
                width: "100%",
                height: 250,
                borderRadius: 16,
                backgroundColor: "#111827",
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 250,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#1f2937",
                backgroundColor: "#0b1220",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="film-outline" size={34} color="#6b7280" />
              <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                No thumbnail preview
              </Text>
            </View>
          )}

          <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 16, marginBottom: 8 }}>
            Replace video
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => void handlePickVideo()}
              style={{
                flex: 1,
                backgroundColor: "#111827",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
              }}
            >
              <Ionicons name="images-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>Choose Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleRecordVideo()}
              style={{
                flex: 1,
                backgroundColor: "#4f46e5",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
              }}
            >
              <Ionicons name="videocam-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>Record</Text>
            </TouchableOpacity>
          </View>
          {videoUri ? (
            <View
              style={{
                marginTop: 10,
                borderWidth: 1,
                borderColor: "#1f2937",
                backgroundColor: "#0b1220",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#f9fafb", fontSize: 13, fontWeight: "700" }}>
                New video selected
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                {videoFileName}
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                Duration: {formatDuration(videoDurationMs)}
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
              Keep current video if you don't choose a new one.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
    </View>
  );
}
