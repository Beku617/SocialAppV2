import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { type StoryGroup } from "../../services/api";

export default function StoriesSection({
  storyGroups,
  currentUserId,
  userAvatar,
  userName,
  onCreateStory,
  onViewStory,
}: {
  storyGroups: StoryGroup[];
  currentUserId: string | null;
  userAvatar: string;
  userName: string;
  onCreateStory: () => void;
  onViewStory: (group: StoryGroup) => void;
}) {
  const myGroup = storyGroups.find((g) => g.user.id === currentUserId);
  const otherGroups = storyGroups.filter((g) => g.user.id !== currentUserId);
  const currentUserAvatar =
    userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`;

  return (
    <View
      style={{
        paddingTop: 6,
        paddingBottom: 10,
        backgroundColor: "#000000",
        borderBottomWidth: 1,
        borderBottomColor: "#111827",
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}
      >
        {/* Your Story / Add Story */}
        <TouchableOpacity
          onPress={onCreateStory}
          style={{ alignItems: "center", width: 80 }}
        >
          <View
            style={{
              width: 80,
              height: 80,
                borderRadius: 40,
                padding: 3,
                backgroundColor: "#111827",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 38,
                  borderWidth: 2,
                  borderColor: "#1f2937",
                  overflow: "hidden",
                  backgroundColor: "#111827",
                }}
              >
              <Image
                source={{
                  uri: currentUserAvatar,
                }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                alignSelf: "center",
                left: 28,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#4f46e5",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#0b1220",
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: "#9ca3af",
              marginTop: 8,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            Add Story
          </Text>
        </TouchableOpacity>

        {myGroup ? (
          <TouchableOpacity
            onPress={() => onViewStory(myGroup)}
            style={{ alignItems: "center", width: 80 }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                padding: 3,
                backgroundColor: "#4f46e5",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 38,
                  borderWidth: 2,
                  borderColor: "#0b1220",
                  overflow: "hidden",
                  backgroundColor: "#111827",
                }}
              >
                <Image
                  source={{ uri: currentUserAvatar }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#9ca3af",
                marginTop: 8,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              You
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Other users' stories */}
        {otherGroups.map((group) => (
          <TouchableOpacity
            key={group.user.id}
            onPress={() => onViewStory(group)}
            style={{ alignItems: "center", width: 80 }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                padding: 3,
                backgroundColor: "#4f46e5",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 38,
                  borderWidth: 2,
                  borderColor: "#0b1220",
                  overflow: "hidden",
                  backgroundColor: "#111827",
                }}
              >
                <Image
                  source={{
                    uri:
                      group.user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(group.user.name)}&background=4f46e5&color=fff`,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#9ca3af",
                marginTop: 8,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {group.user.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
