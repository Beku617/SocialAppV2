import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Image, Text, View } from "react-native";
import type { Post } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function UserProfilePosts({ posts }: { posts: Post[] }) {
  const gridSize = (SCREEN_WIDTH - 6) / 3;

  return (
    <>
      {/* Posts section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          gap: 6,
        }}
      >
        <Ionicons name="grid-outline" size={16} color="#4f46e5" />
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>
          Posts
        </Text>
      </View>

      {/* Posts grid */}
      {posts.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 2,
            paddingHorizontal: 1,
          }}
        >
          {posts.map((post) => (
            <View
              key={post.id}
              style={{
                width: gridSize,
                height: gridSize,
                backgroundColor: "#f3f4f6",
              }}
            >
              {(post.imageUrls?.[0] || post.imageUrl) ? (
                <>
                  <Image
                    source={{ uri: post.imageUrls?.[0] || post.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  {(post.imageUrls?.length || 0) > 1 ? (
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
                    backgroundColor: "#eef2ff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      textAlign: "center",
                    }}
                    numberOfLines={4}
                  >
                    {post.text}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="images-outline" size={40} color="#d1d5db" />
          <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>
            No posts yet
          </Text>
        </View>
      )}
    </>
  );
}
