import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchMyReels,
  fetchPosts,
  getFollowersList,
  getFollowingList,
  getMe,
  updateProfile,
  type Post,
  type Reel,
  type SearchUserResult,
  type UserProfile,
} from "../../services/api";
import {
  EditProfileModal,
  ProfileHeader,
  ProfilePostsSection,
  ProfileSummarySection,
} from "../../components/profile";
import UsersListModal from "../../components/dashboard/UsersListModal";

// ─── Main Profile Screen ────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myReels, setMyReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit profile modal
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  // Followers / following modals
  const [followListVisible, setFollowListVisible] = useState(false);
  const [followListTitle, setFollowListTitle] = useState("Followers");
  const [followListUsers, setFollowListUsers] = useState<SearchUserResult[]>(
    [],
  );
  const [followListLoading, setFollowListLoading] = useState(false);

  const loadData = async () => {
    const [profileRes, postsRes, reelsRes] = await Promise.all([
      getMe(),
      fetchPosts(),
      fetchMyReels(),
    ]);
    if (profileRes.data) {
      setProfile(profileRes.data);
    }
    if (postsRes.data && profileRes.data) {
      const mine = postsRes.data.filter(
        (p) => p.author.id === profileRes.data!.id,
      );
      setMyPosts(mine);
    }
    if (reelsRes.data) {
      setMyReels(reelsRes.data);
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const openEditProfile = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditBio(profile.bio || "");
    setEditAvatar(profile.avatarUrl || "");
    setEditVisible(true);
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const mime = result.assets[0].mimeType || "image/jpeg";
      setEditAvatar(`data:${mime};base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setSaving(true);
    const { data, error } = await updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatarUrl: editAvatar || undefined,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    if (data) setProfile(data);
    setEditVisible(false);
  };

  const openFollowers = async () => {
    if (!profile) return;
    setFollowListTitle("Followers");
    setFollowListUsers([]);
    setFollowListLoading(true);
    setFollowListVisible(true);
    const res = await getFollowersList(profile.id);
    if (res.data) setFollowListUsers(res.data);
    setFollowListLoading(false);
  };

  const openFollowing = async () => {
    if (!profile) return;
    setFollowListTitle("Following");
    setFollowListUsers([]);
    setFollowListLoading(true);
    setFollowListVisible(true);
    const res = await getFollowingList(profile.id);
    if (res.data) setFollowListUsers(res.data);
    setFollowListLoading(false);
  };

  const avatarUri =
    profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}&background=4f46e5&color=fff&size=200`;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <ProfileHeader
        title={profile?.name || "Profile"}
        topInset={insets.top}
        onOpenSettings={() => router.push("/settings-activity")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: "#000000" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4f46e5"]}
            tintColor="#4f46e5"
          />
        }
      >
        <ProfileSummarySection
          avatarUri={avatarUri}
          displayName={profile?.name || "User"}
          bio={profile?.bio}
          postsCount={myPosts.length}
          followersCount={profile?.followersCount ?? 0}
          followingCount={profile?.followingCount ?? 0}
          onOpenEditProfile={openEditProfile}
          onOpenFollowers={openFollowers}
          onOpenFollowing={openFollowing}
        />
        <ProfilePostsSection posts={myPosts} reels={myReels} />
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        bottomInset={insets.bottom}
        editName={editName}
        editBio={editBio}
        editAvatar={editAvatar}
        saving={saving}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
        onPickAvatar={pickAvatar}
        onEditNameChange={setEditName}
        onEditBioChange={setEditBio}
      />

      {/* ── Followers/Following List Modal ─────────────────────────── */}
      <UsersListModal
        visible={followListVisible}
        title={followListTitle}
        users={followListUsers}
        loading={followListLoading}
        onClose={() => setFollowListVisible(false)}
      />
    </View>
  );
}
