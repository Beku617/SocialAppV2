import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Post, Reel } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;
const FIXED_ROWS = 6;
const MIN_GRID_SLOTS = FIXED_ROWS * 3;
const GRID_MIN_HEIGHT = FIXED_ROWS * GRID_SIZE + (FIXED_ROWS - 1) * GRID_GAP;
type TabKey = "posts" | "reels";
type GridItem =
  | { kind: "post"; id: string; post: Post }
  | { kind: "reel"; id: string; reel: Reel }
  | { kind: "placeholder"; id: string };

type ProfilePostsSectionProps = {
  posts: Post[];
  reels: Reel[];
};

export default function ProfilePostsSection({
  posts,
  reels,
}: ProfilePostsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

  const gridData = useMemo<GridItem[]>(
    () => {
      const items: GridItem[] =
        activeTab === "posts"
          ? posts.map((post) => ({ kind: "post" as const, id: post.id, post }))
          : reels.map((reel) => ({ kind: "reel" as const, id: reel.id, reel }));

      const placeholders: GridItem[] = Array.from(
        { length: Math.max(0, MIN_GRID_SLOTS - items.length) },
        (_, index) => ({
          kind: "placeholder" as const,
          id: `placeholder-${activeTab}-${index}`,
        }),
      );

      return [...items, ...placeholders];
    },
    [activeTab, posts, reels],
  );

  const isPostsTab = activeTab === "posts";

  const renderItem = ({ item, index }: { item: GridItem; index: number }) => (
    <>
      {item.kind === "placeholder" ? (
        <View
          style={{
            width: GRID_SIZE,
            height: GRID_SIZE,
            marginRight: index % 3 === 2 ? 0 : GRID_GAP,
            marginBottom: GRID_GAP,
          }}
        />
      ) : (
        <View
          style={{
            width: GRID_SIZE,
            height: GRID_SIZE,
            marginRight: index % 3 === 2 ? 0 : GRID_GAP,
            marginBottom: GRID_GAP,
            backgroundColor: "#111827",
          }}
        >
          {item.kind === "post" ? (
            (item.post.imageUrls?.[0] || item.post.imageUrl) ? (
              <>
                <Image
                  source={{ uri: item.post.imageUrls?.[0] || item.post.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {(item.post.imageUrls?.length || 0) > 1 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      backgroundColor: "rgba(17,24,39,0.7)",
                      borderRadius: 999,
                      padding: 4,
                    }}
                  >
                    <Ionicons name="images-outline" size={12} color="#fff" />
                  </View>
                ) : null}
              </>
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 8,
                  backgroundColor: "#111827",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: "#c4b5fd",
                    textAlign: "center",
                  }}
                  numberOfLines={4}
                >
                  {item.post.text}
                </Text>
              </View>
            )
          ) : (item.reel.thumbUrl || item.reel.playbackUrl || item.reel.originalUrl) ? (
            <>
              <Image
                source={{
                  uri: item.reel.thumbUrl || item.reel.playbackUrl || item.reel.originalUrl,
                }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  backgroundColor: "rgba(17,24,39,0.7)",
                  borderRadius: 999,
                  padding: 4,
                }}
              >
                <Ionicons name="play" size={10} color="#fff" />
              </View>
            </>
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#111827",
              }}
            >
              <Ionicons name="play-circle-outline" size={22} color="#a5b4fc" />
            </View>
          )}
        </View>
      )}
    </>
  );

  return (
    <View
      style={{
        backgroundColor: "#000000",
        borderTopWidth: 1,
        borderTopColor: "#111827",
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

      <View
        style={{
          backgroundColor: "#020617",
          minHeight: GRID_MIN_HEIGHT,
        }}
      >
        <FlatList
          key={activeTab}
          data={gridData}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={{ justifyContent: "flex-start" }}
          renderItem={renderItem}
          contentContainerStyle={{ alignItems: "flex-start" }}
        />
      </View>
    </View>
  );
}
