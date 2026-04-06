import { Image, Text, TouchableOpacity, View } from "react-native";
import type { PublicUserProfile } from "../../services/api";

export default function UserProfileHeader({
  profile,
  postCount,
  followersCount,
  friendsCount,
  onFollowersPress,
  onFriendsPress,
}: {
  profile: PublicUserProfile;
  postCount: number;
  followersCount: number;
  friendsCount: number;
  onFollowersPress: () => void;
  onFriendsPress: () => void;
}) {
  return (
    <>
      {/* Avatar + stats row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
          backgroundColor: "#000000",
        }}
      >
        {/* Avatar */}
        {profile.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={{
              width: 86,
              height: 86,
              borderRadius: 43,
              borderWidth: 3,
              borderColor: "#4f46e5",
            }}
          />
        ) : (
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: 43,
              backgroundColor: "#e0e7ff",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 3,
              borderColor: "#4f46e5",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: "#4f46e5",
              }}
            >
              {profile.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        {/* Stats row */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginLeft: 20,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#f9fafb",
              }}
            >
              {postCount}
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              Posts
            </Text>
          </View>
          <TouchableOpacity
            onPress={onFollowersPress}
            style={{ alignItems: "center" }}
            activeOpacity={0.6}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#f9fafb",
              }}
            >
              {followersCount}
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFriendsPress} style={{ alignItems: "center" }} activeOpacity={0.6}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#f9fafb",
              }}
            >
              {friendsCount}
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name & bio */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#000000" }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#f9fafb",
          }}
        >
          {profile.name}
        </Text>
        {profile.bio ? (
          <Text
            style={{
              fontSize: 14,
              color: "#d1d5db",
              marginTop: 4,
              lineHeight: 20,
            }}
          >
            {profile.bio}
          </Text>
        ) : null}
      </View>
    </>
  );
}
