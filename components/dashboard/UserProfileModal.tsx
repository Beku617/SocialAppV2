import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  acceptFriendRequest,
  getFollowersList,
  getUserProfile,
  sendFriendRequest,
  type Post,
  type PublicUserProfile,
  type Reel,
} from "../../services/api";
import FollowListModal from "./FollowListModal";
import UserProfileActions from "./UserProfileActions";
import UserProfileHeader from "./UserProfileHeader";
import UserProfilePostsGrid from "./UserProfilePostsGrid";

export default function UserProfileModal({
  visible,
  userId,
  onClose,
  onMessage,
}: {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
  onMessage: (userId: string, name: string, avatar: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [requestIncoming, setRequestIncoming] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const [followListVisible, setFollowListVisible] = useState(false);
  const [followListTitle, setFollowListTitle] = useState("Followers");
  const [followListUsers, setFollowListUsers] = useState<
    { id: string; name: string; avatarUrl?: string }[]
  >([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    setProfile(null);
    setPosts([]);
    setReels([]);
    setPostCount(0);
    setIsOwnProfile(false);
    setIsFriend(false);
    setRequestPending(false);
    setRequestIncoming(false);
    setFollowersCount(0);
    setFriendsCount(0);
    setActionLoading(false);

    (async () => {
      const res = await getUserProfile(userId);
      if (res.data) {
        setProfile(res.data.user);
        setPosts(res.data.posts || []);
        setReels(res.data.reels || []);
        setPostCount(res.data.postCount || 0);
        setIsOwnProfile(Boolean(res.data.isOwnProfile));
        setIsFriend(Boolean(res.data.isFriend));
        setRequestPending(Boolean(res.data.friendRequestPending));
        setRequestIncoming(Boolean(res.data.friendRequestIncoming));
        setFollowersCount(res.data.user.followersCount ?? 0);
        setFriendsCount(res.data.user.friendsCount ?? 0);
      }
      setLoading(false);
    })();
  }, [visible, userId]);

  const handleAddFriend = async () => {
    if (!userId || actionLoading || isOwnProfile || isFriend || requestPending) {
      return;
    }
    setActionLoading(true);
    const res = await sendFriendRequest(userId);
    if (res.data) {
      if (res.data.status === "friends") {
        setIsFriend(true);
        setRequestPending(false);
        setRequestIncoming(false);
      } else {
        setRequestPending(true);
      }
      if (typeof res.data.followersCount === "number") {
        setFollowersCount(res.data.followersCount);
      }
    }
    setActionLoading(false);
  };

  const handleAcceptFriend = async () => {
    if (!userId || actionLoading || isOwnProfile || isFriend || !requestIncoming) {
      return;
    }
    setActionLoading(true);
    const res = await acceptFriendRequest(userId);
    if (res.data) {
      setIsFriend(true);
      setRequestPending(false);
      setRequestIncoming(false);
      if (typeof res.data.friendsCount === "number") {
        setFriendsCount(res.data.friendsCount);
      }
    }
    setActionLoading(false);
  };

  const openFollowersList = async () => {
    if (!userId) return;
    setFollowListTitle("Followers");
    setFollowListVisible(true);
    setFollowListLoading(true);
    setFollowListUsers([]);
    const res = await getFollowersList(userId);
    if (res.data) setFollowListUsers(res.data);
    setFollowListLoading(false);
  };

  const openFriendsListScreen = () => {
    if (!userId) return;
    router.push({
      pathname: "/friends",
      params: { userId, userName: profile?.name || "Friends" },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <View
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: 14,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "#111827",
            backgroundColor: "#000000",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#111827",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#f9fafb" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 17,
              fontWeight: "700",
              color: "#f9fafb",
              marginRight: 38,
            }}
          >
            {profile?.name || "Profile"}
          </Text>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : profile ? (
          <ScrollView
            style={{ backgroundColor: "#000000" }}
            showsVerticalScrollIndicator={false}
          >
            <UserProfileHeader
              profile={profile}
              postCount={postCount}
              followersCount={followersCount}
              friendsCount={friendsCount}
              onFollowersPress={openFollowersList}
              onFriendsPress={openFriendsListScreen}
            />

            <UserProfileActions
              isOwnProfile={isOwnProfile}
              isFriend={isFriend}
              requestPending={requestPending}
              requestIncoming={requestIncoming}
              actionLoading={actionLoading}
              onAddFriend={() => void handleAddFriend()}
              onAcceptFriend={() => void handleAcceptFriend()}
              onMessage={() => {
                if (profile && userId) {
                  onMessage(userId, profile.name, profile.avatarUrl || "");
                }
              }}
            />

            <UserProfilePostsGrid posts={posts} reels={reels} />
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="person-outline" size={48} color="#374151" />
            <Text style={{ fontSize: 15, color: "#6b7280", marginTop: 8 }}>
              User not found
            </Text>
          </View>
        )}
      </View>

      <FollowListModal
        visible={followListVisible}
        title={followListTitle}
        users={followListUsers}
        loading={followListLoading}
        onClose={() => setFollowListVisible(false)}
      />
    </Modal>
  );
}
