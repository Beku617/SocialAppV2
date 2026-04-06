import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import type { Post } from "../../services/api";
import type { Reel } from "../../services/reels";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

type TabKey = "posts" | "reels";
type GridItem =
  | { kind: "post"; id: string; post: Post }
  | { kind: "reel"; id: string; reel: Reel };

export default function UserProfilePostsGrid({
  posts,
  reels,
}: {
  posts: Post[];
  reels: Reel[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const isPostsTab = activeTab === "posts";

  const items = useMemo<GridItem[]>(
    () =>
      isPostsTab
        ? posts.map((post) => ({ kind: "post", id: post.id, post }))
        : reels.map((reel) => ({ kind: "reel", id: reel.id, reel })),
    [isPostsTab, posts, reels],
  );

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: "#111827",
        backgroundColor: "#000000",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 40,
          paddingVertical: 12,
          backgroundColor: "#000000",
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("posts")}
          style={{
            borderBottomWidth: 2,
            borderBottomColor: isPostsTab ? "#4f46e5" : "transparent",
            paddingBottom: 10,
          }}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={isPostsTab ? "#f9fafb" : "#6b7280"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("reels")}
          style={{
            borderBottomWidth: 2,
            borderBottomColor: !isPostsTab ? "#4f46e5" : "transparent",
            paddingBottom: 10,
          }}
        >
          <Ionicons
            name="play-outline"
            size={24}
            color={!isPostsTab ? "#f9fafb" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          renderItem={({ item, index }) => {
            const imageUri =
              item.kind === "post"
                ? item.post.imageUrls?.[0] || item.post.imageUrl
                : item.reel.thumbUrl || item.reel.playbackUrl || item.reel.originalUrl;

            return (
              <View
                style={{
                  width: GRID_SIZE,
                  height: GRID_SIZE,
                  marginRight: index % 3 === 2 ? 0 : GRID_GAP,
                  marginBottom: GRID_GAP,
                  backgroundColor: "#111827",
                }}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={item.kind === "post" ? "document-text-outline" : "play-circle-outline"}
                      size={20}
                      color="#94a3b8"
                    />
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: "#94a3b8",
                      }}
                    >
                      {item.kind === "post" ? "Post" : "Reel"}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons
            name={isPostsTab ? "images-outline" : "play-outline"}
            size={40}
            color="#4b5563"
          />
          <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>
            {isPostsTab ? "No posts yet" : "No reels yet"}
          </Text>
        </View>
      )}
    </View>
  );
}
