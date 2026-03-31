import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  createPost,
  createStory,
  getMe,
  getUser,
  completeReelUpload,
  initiateReelUpload,
  markReelFailed,
  markReelReady,
  uploadReelVideoLocal,
  type ReelVisibility,
} from "../services/api";
import MultiImageGrid from "../components/dashboard/MultiImageGrid";

type CreateMode = "post" | "story" | "reel";

const VISIBILITY_OPTIONS: ReelVisibility[] = ["public", "followers", "private"];
const POST_ACTION_CHIPS = [
  { icon: "musical-notes-outline", label: "Music" },
  { icon: "people-outline", label: "People" },
  { icon: "location-outline", label: "Location" },
  { icon: "happy-outline", label: "Feeling" },
];

const formatDuration = (durationMs: number) => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "00:00";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function CreateReelScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const initialModeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const initialMode: CreateMode =
    initialModeParam === "story" || initialModeParam === "reel" ? initialModeParam : "post";
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState("");
  const [visibility, setVisibility] = useState<ReelVisibility>("public");

  const [postImageData, setPostImageData] = useState<string[]>([]);
  const [storyImageData, setStoryImageData] = useState("");

  const [videoUri, setVideoUri] = useState("");
  const [videoFileName, setVideoFileName] = useState("reel.mp4");
  const [videoMimeType, setVideoMimeType] = useState("video/mp4");
  const [videoDurationMs, setVideoDurationMs] = useState(0);

  const [publishing, setPublishing] = useState(false);
  const [userName, setUserName] = useState("You");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    (async () => {
      const meResult = await getMe();
      if (meResult.data) {
        setUserName(meResult.data.name || "You");
        setUserAvatar(meResult.data.avatarUrl || "");
        return;
      }

      const cachedUser = await getUser();
      if (cachedUser?.name) setUserName(cachedUser.name);
      if (cachedUser?.avatarUrl) setUserAvatar(cachedUser.avatarUrl);
    })();
  }, []);

  useEffect(() => {
    if (initialModeParam === "post" || initialModeParam === "story" || initialModeParam === "reel") {
      setMode(initialModeParam);
    }
  }, [initialModeParam]);

  const canPublish = useMemo(() => {
    if (publishing) return false;
    if (mode === "post") return caption.trim().length > 0 || postImageData.length > 0;
    if (mode === "story") return storyImageData.length > 0;
    return videoUri.length > 0;
  }, [publishing, mode, caption, postImageData.length, storyImageData, videoUri]);

  const pickImageAsBase64 = async (fromCamera = false, allowMultiple = false) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        "Permission needed",
        fromCamera
          ? "Please allow camera access."
          : "Please allow gallery access.",
      );
      return null;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.3,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: !allowMultiple,
          allowsMultipleSelection: allowMultiple,
          selectionLimit: allowMultiple ? 10 : 1,
          quality: 0.3,
          base64: true,
        });

    if (result.canceled || !result.assets?.length) return null;

    const imagePayloads = result.assets
      .map((asset) => {
        if (!asset.base64) return "";
        const mimeType = asset.mimeType || "image/jpeg";
        return `data:${mimeType};base64,${asset.base64}`;
      })
      .filter(Boolean);

    return imagePayloads.length > 0 ? imagePayloads : null;
  };

  const handlePickPostImage = async () => {
    const data = await pickImageAsBase64(false, true);
    if (data) setPostImageData(data);
  };

  const handleCapturePostImage = async () => {
    const data = await pickImageAsBase64(true);
    if (data) {
      setPostImageData((current) => [...current, ...data].slice(0, 10));
    }
  };

  const handlePickStoryImage = async () => {
    const data = await pickImageAsBase64(false);
    if (data?.[0]) setStoryImageData(data[0]);
  };

  const handleCaptureStoryImage = async () => {
    const data = await pickImageAsBase64(true);
    if (data?.[0]) setStoryImageData(data[0]);
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow gallery access to upload a reel.");
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
      Alert.alert("Permission needed", "Please allow camera access to record a reel.");
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

  const publishPost = async () => {
    if (!caption.trim() && postImageData.length === 0) {
      Alert.alert("Post is empty", "Add a caption or at least one image.");
      return;
    }
    setPublishing(true);
    const result = await createPost(caption.trim(), postImageData);
    setPublishing(false);

    if (!result.data) {
      Alert.alert("Post failed", result.error || "Failed to create post.");
      return;
    }

    setCaption("");
    setPostImageData([]);
    router.replace("/(dashboard)");
  };

  const publishStory = async () => {
    if (!storyImageData) {
      Alert.alert("Story needs image", "Choose or capture an image for your story.");
      return;
    }
    setPublishing(true);
    const result = await createStory(storyImageData, caption.trim());
    setPublishing(false);

    if (!result.data) {
      Alert.alert("Story failed", result.error || "Failed to create story.");
      return;
    }

    setCaption("");
    setStoryImageData("");
    router.replace("/(dashboard)");
  };

  const publishReel = async () => {
    if (!videoUri) {
      Alert.alert("No video selected", "Choose or record a video first.");
      return;
    }

    setPublishing(true);
    const init = await initiateReelUpload({
      caption: caption.trim(),
      music: music.trim(),
      visibility,
      fileName: videoFileName,
      mimeType: videoMimeType,
    });

    if (!init.data) {
      setPublishing(false);
      Alert.alert("Upload failed", init.error || "Failed to initialize upload.");
      return;
    }

    const reelId = init.data.reel.id;

    const uploaded = await uploadReelVideoLocal(reelId, {
      fileUri: videoUri,
      mimeType: videoMimeType,
      fileName: videoFileName,
    });

    if (!uploaded.data) {
      await markReelFailed(reelId, uploaded.error || "Local upload failed");
      setPublishing(false);
      Alert.alert(
        "Upload failed",
        uploaded.error ||
          "Failed to upload video to server. Try shorter video (under 40MB).",
      );
      return;
    }

    const completed = await completeReelUpload(reelId, {
      storageKey: uploaded.data.storageKey,
      originalUrl: uploaded.data.videoUrl,
    });

    if (!completed.data) {
      await markReelFailed(reelId, completed.error || "Upload completion failed");
      setPublishing(false);
      Alert.alert("Upload failed", completed.error || "Failed to complete upload.");
      return;
    }

    const ready = await markReelReady(reelId, {
      playbackUrl: uploaded.data.videoUrl,
      thumbUrl: "",
      music: music.trim(),
      duration: Math.floor(videoDurationMs / 1000),
      width: 1080,
      height: 1920,
    });

    setPublishing(false);

    if (!ready.data) {
      await markReelFailed(reelId, ready.error || "Processing failed");
      Alert.alert("Upload failed", ready.error || "Failed to finalize reel.");
      return;
    }

    Alert.alert("Reel uploaded", "Your reel is now available in Reels.", [
      { text: "Open Reels", onPress: () => router.replace("/(dashboard)/videos") },
    ]);
  };

  const handlePublish = async () => {
    if (mode === "post") {
      await publishPost();
      return;
    }
    if (mode === "story") {
      await publishStory();
      return;
    }
    await publishReel();
  };

  const avatarUri =
    userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`;

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 18,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Create</Text>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={!canPublish}
          style={{
            backgroundColor: canPublish ? "#4f46e5" : "#c7d2fe",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 18,
            minWidth: 74,
            alignItems: "center",
          }}
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Share</Text>
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
          {mode === "post" ? (
            <>
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
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                    {userName}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                    Public post
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 8, marginBottom: 14 }}
              >
                {POST_ACTION_CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip.label}
                    activeOpacity={0.88}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      borderWidth: 1,
                      borderColor: "#dbe1ea",
                      backgroundColor: "#fff",
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons name={chip.icon as any} size={18} color="#111827" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="What's on your mind?"
                placeholderTextColor="#9ca3af"
                multiline
                style={{
                  minHeight: 92,
                  paddingVertical: 6,
                  fontSize: 18,
                  color: "#111827",
                  textAlignVertical: "top",
                }}
              />
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>
                Caption
              </Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption..."
                placeholderTextColor="#9ca3af"
                multiline
                style={{
                  minHeight: 96,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: "#111827",
                  textAlignVertical: "top",
                }}
              />
            </>
          )}

          {mode === "post" && (
            <>
              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 16, marginBottom: 8 }}>
                Optional images
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={handlePickPostImage}
                  style={{
                    flex: 1,
                    backgroundColor: "#111827",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="images-outline" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Choose Images</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCapturePostImage}
                  style={{
                    flex: 1,
                    backgroundColor: "#4f46e5",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Capture</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 8, gap: 6 }}>
                {postImageData.length > 0 ? (
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {postImageData.length} image{postImageData.length === 1 ? "" : "s"} attached.
                  </Text>
                ) : null}
                {postImageData.length > 0 ? (
                  <View style={{ marginTop: 6 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom: 10,
                      }}
                    >
                      Post preview
                    </Text>
                    <MultiImageGrid
                      images={postImageData}
                      height={320}
                      borderRadius={24}
                    />
                  </View>
                ) : null}
                {postImageData.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setPostImageData([])}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#4f46e5" }}>
                      Clear images
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}

          {mode === "story" && (
            <>
              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 16, marginBottom: 8 }}>
                Story image (required)
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={handlePickStoryImage}
                  style={{
                    flex: 1,
                    backgroundColor: "#111827",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="images-outline" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Choose</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCaptureStoryImage}
                  style={{
                    flex: 1,
                    backgroundColor: "#4f46e5",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Capture</Text>
                </TouchableOpacity>
              </View>
              {storyImageData ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    Story image ready.
                  </Text>
                  <MultiImageGrid
                    images={[storyImageData]}
                    height={300}
                    borderRadius={24}
                  />
                </View>
              ) : null}
            </>
          )}

          {mode === "reel" && (
            <>
              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 16, marginBottom: 6 }}>
                Music
              </Text>
              <TextInput
                value={music}
                onChangeText={setMusic}
                placeholder="Song name or audio title"
                placeholderTextColor="#9ca3af"
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontSize: 15,
                  color: "#111827",
                }}
              />

              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 16, marginBottom: 8 }}>
                Visibility
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
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

              <View
                style={{
                  marginTop: 18,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  backgroundColor: "#fafafa",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="videocam-outline" size={22} color="#374151" />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 }}>
                    {videoUri ? "Video selected" : "No video selected"}
                  </Text>
                </View>
                {videoUri ? (
                  <>
                    <Text
                      style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}
                      numberOfLines={2}
                    >
                      {videoFileName}
                    </Text>
                    <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                      Duration: {formatDuration(videoDurationMs)}
                    </Text>
                  </>
                ) : null}
              </View>
              <Text style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Reel upload saves video on your backend (max ~40MB), so other users can open it.
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  onPress={handlePickVideo}
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
                  onPress={handleRecordVideo}
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
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Record Video</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
