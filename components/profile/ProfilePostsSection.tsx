import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import type { Post } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

type ProfilePostsSectionProps = {
  posts: Post[];
};

export default function ProfilePostsSection({ posts }: ProfilePostsSectionProps) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 40,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            borderBottomWidth: 2,
            borderBottomColor: "#111827",
            paddingBottom: 10,
          }}
        >
          <Ionicons name="grid-outline" size={22} color="#111827" />
        </View>
        <TouchableOpacity>
          <Ionicons name="play-outline" size={24} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="person-circle-outline" size={24} color="#9ca3af" />
        </TouchableOpacity>
      </View>

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
                width: GRID_SIZE,
                height: GRID_SIZE,
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
                      color: "#4f46e5",
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
        <View style={{ alignItems: "center", padding: 40 }}>
          <Ionicons name="camera-outline" size={48} color="#d1d5db" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#9ca3af",
              marginTop: 12,
            }}
          >
            No posts yet
          </Text>
          <Text style={{ fontSize: 13, color: "#d1d5db", marginTop: 4 }}>
            Share your first post!
          </Text>
        </View>
      )}
    </View>
  );
}
