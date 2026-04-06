import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
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
import { addComment, type Comment } from "../../services/api";
import { timeAgo } from "./helpers";

type PostCommentModalProps = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  comments: Comment[];
  onCommentsUpdated: (comments: Comment[]) => void;
};

export default function PostCommentModal({
  visible,
  onClose,
  postId,
  comments,
  onCommentsUpdated,
}: PostCommentModalProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) {
      setText("");
      setSending(false);
      return;
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 130);

    return () => clearTimeout(focusTimer);
  }, [visible]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await addComment(postId, trimmed);
    setSending(false);

    if (!result.data) return;

    onCommentsUpdated([...comments, result.data]);
    setText("");
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
      >
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 999,
              backgroundColor: "#d1d5db",
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 10,
            borderBottomWidth: 0.5,
            borderBottomColor: "#e5e7eb",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
            Comments
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item, index) => item.id || `comment-${index}`}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const avatarUri =
              item.author.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author.name)}&background=ddd&color=333`;

            const safeCreatedAt =
              typeof item.createdAt === "string" && item.createdAt
                ? item.createdAt
                : new Date().toISOString();

            return (
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 10,
                    marginTop: 2,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>
                      {item.author.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                      · {timeAgo(safeCreatedAt)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      marginTop: 3,
                      fontSize: 14,
                      color: "#1f2937",
                      lineHeight: 20,
                    }}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 70 }}>
              <Ionicons name="chatbubble-outline" size={40} color="#d1d5db" />
              <Text style={{ marginTop: 10, fontSize: 14, color: "#9ca3af" }}>
                No comments yet. Be the first.
              </Text>
            </View>
          }
        />

        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: "#e5e7eb",
            backgroundColor: "#fff",
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Write a comment..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              backgroundColor: "#f3f4f6",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 10 : 8,
              color: "#111827",
              fontSize: 14,
              maxHeight: 100,
            }}
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
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
                color={text.trim() ? "#2563eb" : "#d1d5db"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
