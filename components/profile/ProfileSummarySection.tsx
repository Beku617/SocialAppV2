import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

type ProfileSummarySectionProps = {
  avatarUri: string;
  displayName: string;
  bio?: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onOpenEditProfile: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
};

export default function ProfileSummarySection({
  avatarUri,
  displayName,
  bio,
  postsCount,
  followersCount,
  followingCount,
  onOpenEditProfile,
  onOpenFollowers,
  onOpenFollowing,
}: ProfileSummarySectionProps) {
  return (
    <>
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
        <TouchableOpacity onPress={onOpenEditProfile}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              borderWidth: 3,
              borderColor: "#4f46e5",
              padding: 2,
            }}
          >
            <Image
              source={{ uri: avatarUri }}
              style={{ width: "100%", height: "100%", borderRadius: 40 }}
            />
          </View>
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-around",
            marginLeft: 20,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#f9fafb" }}>
              {postsCount}
            </Text>
            <Text style={{ fontSize: 13, color: "#9ca3af" }}>posts</Text>
          </View>
          <TouchableOpacity onPress={onOpenFollowers} style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#f9fafb" }}>
              {followersCount}
            </Text>
            <Text style={{ fontSize: 13, color: "#9ca3af" }}>followers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenFollowing} style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#f9fafb" }}>
              {followingCount}
            </Text>
            <Text style={{ fontSize: 13, color: "#9ca3af" }}>following</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#000000" }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#f9fafb" }}>
          {displayName}
        </Text>
        {bio ? (
          <Text
            style={{
              fontSize: 14,
              color: "#d1d5db",
              marginTop: 3,
              lineHeight: 19,
            }}
          >
            {bio}
          </Text>
        ) : (
          <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 3 }}>
            Tap Edit Profile to add a bio ✨
          </Text>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "#000000",
        }}
      >
        <TouchableOpacity
          onPress={onOpenEditProfile}
          style={{
            flex: 1,
            backgroundColor: "#111827",
            borderWidth: 1,
            borderColor: "#1f2937",
            paddingVertical: 9,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 14 }}>
            Edit profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#111827",
            borderWidth: 1,
            borderColor: "#1f2937",
            paddingVertical: 9,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 14 }}>
            Share profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: 38,
            backgroundColor: "#111827",
            borderWidth: 1,
            borderColor: "#1f2937",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="person-add-outline" size={18} color="#f9fafb" />
        </TouchableOpacity>
      </View>
    </>
  );
}
