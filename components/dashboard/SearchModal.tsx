import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  resolvePostIdFromShareValue,
  searchUsers,
  type SearchUserResult,
} from "../../services/api";

export default function SearchModal({
  visible,
  onClose,
  onViewProfile,
  onOpenPost,
}: {
  visible: boolean;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [resolvedPostId, setResolvedPostId] = useState<string | null>(null);
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResolvedPostId(null);
      setResults([]);
    }
  }, [visible]);

  const doSearch = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const normalized = text.trim();
    const postId = resolvePostIdFromShareValue(normalized);
    if (postId) {
      setResolvedPostId(postId);
      setResults([]);
      setSearching(false);
      return;
    }

    setResolvedPostId(null);

    if (normalized.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(normalized);
      if (res.data) setResults(res.data);
      setSearching(false);
    }, 350);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Search header */}
        <View
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: 14,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#f3f4f6",
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 42,
            }}
          >
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: "#111827",
              }}
              placeholder="Search people or paste post token..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={doSearch}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => doSearch("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {resolvedPostId ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <TouchableOpacity
              onPress={() => onOpenPost(resolvedPostId)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#f8fafc",
              }}
              activeOpacity={0.75}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#e0e7ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="document-text-outline" size={19} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                  Open shared post
                </Text>
                <Text
                  style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}
                  numberOfLines={1}
                >
                  Post ID: {resolvedPostId}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ) : searching && results.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#4f46e5" />
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onViewProfile(item.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                }}
                activeOpacity={0.6}
              >
                {item.avatarUrl ? (
                  <Image
                    source={{ uri: item.avatarUrl }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#f3f4f6",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#e0e7ff",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#4f46e5",
                      }}
                    >
                      {item.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.bio ? (
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.bio}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: "#f3f4f6",
                  marginLeft: 76,
                }}
              />
            )}
          />
        ) : query.trim().length > 0 && !searching ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text
              style={{
                fontSize: 15,
                color: "#9ca3af",
                marginTop: 10,
                fontWeight: "500",
              }}
            >
              No users found
            </Text>
            <Text style={{ fontSize: 13, color: "#d1d5db", marginTop: 4 }}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="search" size={48} color="#e5e7eb" />
            <Text
              style={{
                fontSize: 15,
                color: "#9ca3af",
                marginTop: 10,
                fontWeight: "500",
              }}
            >
              Find people on Connect
            </Text>
            <Text style={{ fontSize: 13, color: "#d1d5db", marginTop: 4 }}>
              Search by name or email
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
