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
import MultiImageGrid from "../../components/dashboard/MultiImageGrid";
import FeedActionDialog from "../../components/dashboard/FeedActionDialog";
import { fetchPostDetails, getMe, getUser, updatePost } from "../../services/api";

export default function EditPostScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ postId?: string | string[] }>();
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caption, setCaption] = useState("");
  const [postImageData, setPostImageData] = useState<string[]>([]);
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

    const loadPost = async () => {
      if (!postId) {
        openDialog({
          title: "Post unavailable",
          message: "We couldn't find the post you want to edit.",
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
      const postResult = await fetchPostDetails(postId);

      if (!mounted) return;

      const meId = meResult.data?.id || cachedUser?.id || null;
      setCurrentUserId(meId);
      setUserName(meResult.data?.name || cachedUser?.name || "You");
      setUserAvatar(meResult.data?.avatarUrl || cachedUser?.avatarUrl || "");

      if (!postResult.data) {
        openDialog({
          title: "Post unavailable",
          message: postResult.error || "We couldn't load this post.",
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

      setCaption(postResult.data.text || "");
      setPostImageData(
        Array.isArray(postResult.data.imageUrls) && postResult.data.imageUrls.length > 0
          ? postResult.data.imageUrls
          : postResult.data.imageUrl
            ? [postResult.data.imageUrl]
            : [],
      );
      setAuthorId(postResult.data.author.id);
      setLoading(false);

      if (meId && postResult.data.author.id !== meId) {
        openDialog({
          title: "Editing not allowed",
          message: "You can edit only your own posts.",
          primaryLabel: "Back",
          tone: "warning",
          onPrimary: () => {
            closeDialog();
            router.back();
          },
        });
      }
    };

    loadPost();

    return () => {
      mounted = false;
    };
  }, [postId]);

  const canSave = useMemo(() => {
    if (saving || loading) return false;
    return caption.trim().length > 0 || postImageData.length > 0;
  }, [caption, loading, postImageData.length, saving]);

  const avatarUri =
    userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`;

  const pickImageAsBase64 = async (fromCamera = false, allowMultiple = false) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      openDialog({
        title: "Permission needed",
        message: fromCamera
          ? "Please allow camera access."
          : "Please allow gallery access.",
        primaryLabel: "OK",
        tone: "warning",
        onPrimary: closeDialog,
      });
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

  const handleSave = async () => {
    if (!postId) return;
    if (authorId && currentUserId && authorId !== currentUserId) {
      openDialog({
        title: "Editing not allowed",
        message: "You can edit only your own posts.",
        primaryLabel: "Back",
        tone: "warning",
        onPrimary: () => {
          closeDialog();
          router.back();
        },
      });
      return;
    }

    if (!caption.trim() && postImageData.length === 0) {
      openDialog({
        title: "Post is empty",
        message: "Add a caption or at least one image before saving.",
        primaryLabel: "OK",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    setSaving(true);
    const result = await updatePost(postId, caption.trim(), postImageData);
    setSaving(false);

    if (!result.data) {
      openDialog({
        title: "Save failed",
        message: result.error || "We couldn't update your post.",
        primaryLabel: "OK",
        tone: "warning",
        onPrimary: closeDialog,
      });
      return;
    }

    router.replace("/(dashboard)");
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
    );
  }

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Edit Post</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={{
            backgroundColor: canSave ? "#4f46e5" : "#c7d2fe",
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
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Save</Text>
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
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                {userName}
              </Text>
              <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                Update your post
              </Text>
            </View>
          </View>

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

          <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 16, marginBottom: 8 }}>
            Images
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
                  Preview
                </Text>
                <MultiImageGrid images={postImageData} height={320} borderRadius={24} />
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
