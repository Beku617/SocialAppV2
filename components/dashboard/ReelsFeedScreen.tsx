import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  deleteReel,
  fetchReels,
  getHiddenReelIds,
  getUser,
  hideReel as hideReelLocally,
  reportReel,
  toggleReelLike,
  toggleReelSave,
  viewReel,
  type Reel,
  type ReelTab,
  type ReelVisibility,
} from "../../services/api";
import ReelCommentModal from "./ReelCommentModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const VIDEO_STRETCH_Y = 1.02;

const formatCount = (count: number): string => {
  if (!Number.isFinite(count)) return "0";
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
};

const reelVisibilityIcon = (visibility: ReelVisibility) => {
  if (visibility === "private") return "lock-closed-outline";
  if (visibility === "friends") return "people-outline";
  return "globe-outline";
};

const formatReelAge = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─── IG-style Action Button ─────────────────────────────────────────────
function ActionButton({
  icon,
  label,
  color = "#fff",
  size = 30,
  onPress,
}: {
  icon: string;
  label: string;
  color?: string;
  size?: number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={{ alignItems: "center", marginBottom: 4 }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon as any} size={size} color={color} />
      <Text
        style={{
          color: "#fff",
          fontSize: 12,
          fontWeight: "600",
          marginTop: 3,
          textShadowColor: "rgba(0,0,0,0.6)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Reel Item ──────────────────────────────────────────────────────────
function ReelItem({
  reel,
  isActive,
  itemHeight,
  screenFocused,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onOpenMenu,
}: {
  reel: Reel;
  isActive: boolean;
  itemHeight: number;
  screenFocused: boolean;
  onToggleLike: (reelId: string) => void;
  onToggleSave: (reelId: string) => void;
  onOpenComments: (reelId: string) => void;
  onOpenMenu: (reelId: string) => void;
}) {
  const bottomInfoOffset = Platform.OS === "ios" ? 6 : 4;
  const actionsBottomOffset = bottomInfoOffset + 60;
  const coverImage = reel.thumbUrl || "";
  const avatarUri =
    reel.author.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.author.name)}&background=333&color=fff`;

  const videoRef = useRef<Video>(null);
  const [paused, setPaused] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const hasVideo = !!reel.playbackUrl;

  // Fade animation for pause overlay
  const pauseOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pauseOpacity, {
      toValue: paused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [paused]);

  // Auto-play/pause based on whether reel is active AND screen is focused
  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
    if (isActive && !paused && screenFocused) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive, paused, hasVideo, screenFocused]);

  // Reset pause state when reel becomes active
  useEffect(() => {
    if (isActive) {
      setPaused(false);
      setPositionMs(0);
    }
  }, [isActive]);

  const togglePause = () => {
    if (!hasVideo) return;
    setPaused((prev) => !prev);
  };

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.durationMillis) setDurationMs(status.durationMillis);
    setPositionMs(status.positionMillis || 0);
  };

  const skipForward = async () => {
    if (!videoRef.current || !durationMs) return;
    const newPos = Math.min(positionMs + 3000, durationMs);
    await videoRef.current.setPositionAsync(newPos);
    setPositionMs(newPos);
  };

  const skipBackward = async () => {
    if (!videoRef.current) return;
    const newPos = Math.max(positionMs - 3000, 0);
    await videoRef.current.setPositionAsync(newPos);
    setPositionMs(newPos);
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  // Format seconds to mm:ss
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: itemHeight,
        backgroundColor: "#000",
      }}
    >
      {/* Video or thumbnail */}
      {hasVideo && !videoError ? (
        <TouchableOpacity
          activeOpacity={1}
          onPress={togglePause}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Video
            ref={videoRef}
            source={{ uri: reel.playbackUrl }}
            style={{
              width: "100%",
              height: "98%",
              alignSelf: "center",
              transform: [{ scaleY: VIDEO_STRETCH_Y }],
            }}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={isActive && !paused && screenFocused}
            isMuted={false}
            posterSource={coverImage ? { uri: coverImage } : undefined}
            usePoster={!!coverImage}
            onLoad={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            onPlaybackStatusUpdate={handlePlaybackStatus}
            progressUpdateIntervalMillis={250}
          />

          {/* Pause overlay with controls */}
          <Animated.View
            pointerEvents={paused ? "auto" : "none"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: pauseOpacity,
            }}
          >
            {/* Semi-transparent overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
            />

            {/* Skip backward / Play / Skip forward */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 44,
              }}
            >
              <TouchableOpacity
                onPress={skipBackward}
                style={{ alignItems: "center" }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="play-back"
                  size={28}
                  color="rgba(255,255,255,0.85)"
                />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 3,
                  }}
                >
                  3s
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="play"
                  size={32}
                  color="#fff"
                  style={{ marginLeft: 3 }}
                />
              </View>

              <TouchableOpacity
                onPress={skipForward}
                style={{ alignItems: "center" }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="play-forward"
                  size={28}
                  color="rgba(255,255,255,0.85)"
                />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 3,
                  }}
                >
                  3s
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Loading spinner while video loads */}
          {!videoLoaded && isActive && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ) : coverImage ? (
        <Image
          source={{ uri: coverImage }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          resizeMode="contain"
        />
      ) : (
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "#0b1120",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="film-outline"
            size={54}
            color="rgba(255,255,255,0.22)"
          />
        </View>
      )}

      {/* Bottom gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.7)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 280,
        }}
        pointerEvents="none"
      />

      {/* Top gradient for header */}
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
        }}
        pointerEvents="none"
      />

      {/* Right side action buttons — IG style */}
      <View
        style={{
          position: "absolute",
          right: 10,
          bottom: actionsBottomOffset,
          alignItems: "center",
          gap: 16,
        }}
      >
        <ActionButton
          icon={reel.likedByMe ? "heart" : "heart-outline"}
          label={formatCount(reel.likesCount)}
          color={reel.likedByMe ? "#ef4444" : "#fff"}
          size={30}
          onPress={() => onToggleLike(reel.id)}
        />
        <ActionButton
          icon="chatbubble-outline"
          label={formatCount(reel.commentsCount)}
          size={28}
          onPress={() => onOpenComments(reel.id)}
        />
        <ActionButton
          icon="paper-plane-outline"
          label={formatCount(reel.sharesCount)}
          size={28}
        />
        <ActionButton
          icon={reel.savedByMe ? "bookmark" : "bookmark-outline"}
          label={formatCount(reel.savesCount)}
          size={28}
          onPress={() => onToggleSave(reel.id)}
        />

        {/* Three dots menu */}
        <TouchableOpacity
          style={{ marginTop: 2 }}
          activeOpacity={0.7}
          onPress={() => onOpenMenu(reel.id)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info area */}
      <View
        style={{
          position: "absolute",
          bottom: bottomInfoOffset,
          left: 14,
          right: 70,
        }}
      >
        {/* Author row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Image
            source={{ uri: avatarUri }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: "#fff",
              marginRight: 10,
            }}
          />

          <Text
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: "700",
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
            numberOfLines={1}
          >
            {reel.author.name}
          </Text>

          {/* Follow button — IG style rounded */}
          {!reel.ownedByMe && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                borderWidth: 1.5,
                borderColor: "#fff",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 5,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Add Friend
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: 12,
              fontWeight: "500",
            }}
          >
            {formatReelAge(reel.createdAt)}
          </Text>
          <Ionicons
            name={reelVisibilityIcon(reel.visibility) as any}
            size={12}
            color="rgba(255,255,255,0.78)"
          />
        </View>

        {/* Caption */}
        <Text
          style={{
            color: "#fff",
            fontSize: 13.5,
            fontWeight: "500",
            lineHeight: 19,
            textShadowColor: "rgba(0,0,0,0.6)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
            marginBottom: 6,
          }}
          numberOfLines={2}
        >
          {reel.caption || ""}
        </Text>

        {/* Music / audio row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <Ionicons name="musical-note" size={13} color="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: 12.5,
              fontWeight: "500",
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {reel.music || "Original audio"}
          </Text>

          {/* Album art thumbnail — bottom right */}
        </View>
      </View>

      {/* Album art / reel thumbnail — bottom right corner */}
      {coverImage ? (
        <View
          style={{
            position: "absolute",
            right: 12,
            bottom: bottomInfoOffset + 4,
            width: 32,
            height: 32,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.5)",
            overflow: "hidden",
          }}
        >
          <Image
            source={{ uri: coverImage }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Progress bar — visible only when paused */}
      {hasVideo && durationMs > 0 && paused && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            opacity: pauseOpacity,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 14,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              {formatTime(positionMs)}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {formatTime(durationMs)}
            </Text>
          </View>
          <View
            style={{
              height: 3,
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          >
            <View
              style={{
                width: `${Math.min(progress * 100, 100)}%`,
                height: "100%",
                backgroundColor: "#fff",
              }}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Reels Feed Screen ──────────────────────────────────────────────────
export default function ReelsFeedScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<ReelTab>("reels");
  const [activeIndex, setActiveIndex] = useState(0);
  const [listHeight, setListHeight] = useState(SCREEN_HEIGHT);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageVisible, setManageVisible] = useState(false);
  const [manageBusy, setManageBusy] = useState(false);
  const [manageReelId, setManageReelId] = useState<string | null>(null);
  const manageSheetTranslateY = useRef(new Animated.Value(0)).current;

  // Comment modal state
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; avatarUrl: string } | null>(null);

  useEffect(() => {
    getUser().then((u) => {
      if (u) setCurrentUser({ name: u.name, avatarUrl: u.avatarUrl || "" });
    });
  }, []);

  const openComments = (reelId: string) => setCommentReelId(reelId);
  const closeComments = () => setCommentReelId(null);

  const handleCommentsCountChange = (count: number) => {
    if (!commentReelId) return;
    setReels((prev) =>
      prev.map((r) => (r.id === commentReelId ? { ...r, commentsCount: count } : r)),
    );
  };

  const viewedReelIds = useRef<Set<string>>(new Set());
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const onListLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const nextHeight = nativeEvent.layout.height;
    if (Math.abs(nextHeight - listHeight) > 1) {
      setListHeight(nextHeight);
    }
  };

  const loadReels = useCallback(async () => {
    setLoading(true);
    const [first, hiddenIds] = await Promise.all([
      fetchReels(activeTab),
      getHiddenReelIds(),
    ]);
    if (first.error) {
      setReels([]);
      setLoading(false);
      Alert.alert("Reels", first.error);
      return;
    }

    const hiddenIdSet = new Set(hiddenIds);
    const next = (first.data || []).filter((reel) => !hiddenIdSet.has(reel.id));
    setReels(next);
    setActiveIndex((prev) =>
      next.length ? Math.min(prev, next.length - 1) : 0,
    );
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    viewedReelIds.current.clear();
    loadReels();
  }, [loadReels]);

  useEffect(() => {
    const current = reels[activeIndex];
    if (!current || viewedReelIds.current.has(current.id)) return;
    viewedReelIds.current.add(current.id);
    viewReel(current.id).then((result) => {
      if (!result.data) return;
      setReels((prev) =>
        prev.map((reel) =>
          reel.id === current.id
            ? {
                ...reel,
                viewsCount: result.data?.viewsCount ?? reel.viewsCount,
              }
            : reel,
        ),
      );
    });
  }, [activeIndex, reels]);

  const handleToggleLike = async (reelId: string) => {
    const result = await toggleReelLike(reelId);
    if (!result.data) return;
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              likedByMe: result.data!.liked,
              likesCount: result.data!.likeCount,
            }
          : reel,
      ),
    );
  };

  const handleToggleSave = async (reelId: string) => {
    let previousSavedByMe = false;
    let previousSavesCount = 0;

    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id !== reelId) return reel;
        previousSavedByMe = reel.savedByMe;
        previousSavesCount = reel.savesCount;
        const nextSaved = !reel.savedByMe;
        const nextCount = Math.max(
          0,
          reel.savesCount + (nextSaved ? 1 : -1),
        );
        return {
          ...reel,
          savedByMe: nextSaved,
          savesCount: nextCount,
        };
      }),
    );

    const result = await toggleReelSave(reelId);
    if (!result.data) {
      setReels((prev) =>
        prev.map((reel) =>
          reel.id === reelId
            ? {
                ...reel,
                savedByMe: previousSavedByMe,
                savesCount: previousSavesCount,
              }
            : reel,
        ),
      );
      Alert.alert("Reels", result.error || "Failed to save reel");
      return;
    }
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              savedByMe: result.data!.saved,
              savesCount: result.data!.savesCount,
            }
          : reel,
      ),
    );
  };

  const handleHideReel = async () => {
    if (!managedReel || managedReel.ownedByMe) return;
    await hideReelLocally(managedReel.id);
    setReels((prev) => prev.filter((reel) => reel.id !== managedReel.id));
    closeManageMenu();
  };

  const handleReportReel = async () => {
    if (!managedReel || managedReel.ownedByMe) return;
    setManageBusy(true);
    const result = await reportReel(managedReel.id, "other", "");
    setManageBusy(false);
    if (!result.data) {
      Alert.alert("Reels", result.error || "Failed to report reel");
      return;
    }
    closeManageMenu();
    Alert.alert("Reels", "Report submitted. We’ll review this reel.");
  };

  const currentReel = reels[activeIndex];
  const managedReel =
    reels.find((reel) => reel.id === manageReelId) || currentReel;

  const closeManageMenu = useCallback(() => {
    Animated.timing(manageSheetTranslateY, {
      toValue: 260,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setManageVisible(false);
      setManageReelId(null);
      manageSheetTranslateY.setValue(0);
    });
  }, [manageSheetTranslateY]);

  const openManageMenu = (reelId?: string) => {
    setManageReelId(reelId || currentReel?.id || null);
    manageSheetTranslateY.setValue(0);
    setManageVisible(true);
  };

  const handleManageEdit = () => {
    if (!managedReel?.ownedByMe) return;
    closeManageMenu();
    router.push({
      pathname: "/edit-reel/[reelId]",
      params: { reelId: managedReel.id },
    });
  };

  const handleManageDelete = async () => {
    if (!managedReel?.ownedByMe) return;
    setManageBusy(true);
    const result = await deleteReel(managedReel.id);
    setManageBusy(false);
    if (!result.data) {
      Alert.alert("Manage Reels", result.error || "Failed to delete reel");
      return;
    }
    setReels((prev) => prev.filter((reel) => reel.id !== managedReel.id));
    closeManageMenu();
  };

  const manageSheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 8,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy <= 0) return;
        manageSheetTranslateY.setValue(Math.min(gestureState.dy, 320));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.2) {
          closeManageMenu();
          return;
        }
        Animated.spring(manageSheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(manageSheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 10, color: "#d1d5db", fontSize: 13 }}>
            Loading reels...
          </Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReelItem
              reel={item}
              isActive={item.id === reels[activeIndex]?.id}
              itemHeight={listHeight}
              screenFocused={isFocused}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onOpenComments={openComments}
              onOpenMenu={openManageMenu}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={listHeight}
          decelerationRate="fast"
          onLayout={onListLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: listHeight,
            offset: listHeight * index,
            index,
          })}
          ListEmptyComponent={
            activeTab === "friends" ? (
              <View
                style={{
                  height: listHeight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                  No reels
                </Text>
              </View>
            ) : (
              <View
                style={{
                  height: listHeight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="videocam-outline" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 10, color: "#fff", fontWeight: "700" }}>
                  No reels yet
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    color: "#9ca3af",
                    fontSize: 13,
                    textAlign: "center",
                    paddingHorizontal: 28,
                  }}
                >
                  Tap + on Home header to create a post, story, or reel.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(dashboard)")}
                  style={{
                    marginTop: 14,
                    backgroundColor: "#111827",
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Go to Home (+)
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      )}

      {/* IG-style top header overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + 6,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: + add reel */}
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/create-reel", params: { mode: "reel" } })
          }
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Center: Reels / Friends tabs */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 22 }}>
          <TouchableOpacity onPress={() => setActiveTab("reels")}>
            <Text
              style={{
                fontSize: 19,
                fontWeight: activeTab === "reels" ? "800" : "600",
                color: "#fff",
                opacity: activeTab === "reels" ? 1 : 0.55,
              }}
            >
              Reels
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("friends")}>
            <Text
              style={{
                fontSize: 19,
                fontWeight: activeTab === "friends" ? "800" : "600",
                color: "#fff",
                opacity: activeTab === "friends" ? 1 : 0.55,
              }}
            >
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: 30 }} />
      </View>

      <Modal
        visible={manageVisible}
        transparent
        animationType="fade"
        onRequestClose={closeManageMenu}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(2, 6, 23, 0.45)",
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeManageMenu} />
          <Animated.View
            {...manageSheetPanResponder.panHandlers}
            style={{
              backgroundColor: "#0b1220",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopWidth: 1,
              borderTopColor: "#1f2937",
              transform: [{ translateY: manageSheetTranslateY }],
            }}
          >
            <View
              style={{
                width: 46,
                height: 5,
                borderRadius: 999,
                backgroundColor: "#374151",
                alignSelf: "center",
                marginBottom: 12,
              }}
            />

            {!managedReel?.ownedByMe ? (
              <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>
                Reel options
              </Text>
            ) : null}
            <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
              {managedReel
                ? `${managedReel.author.name} · ${formatReelAge(managedReel.createdAt)}`
                : "No reel selected"}
            </Text>

            <View style={{ marginTop: 12, gap: 8 }}>
              {managedReel?.ownedByMe ? (
                <>
                  <TouchableOpacity
                    disabled={manageBusy}
                    onPress={handleManageEdit}
                    style={{
                      borderWidth: 1,
                      borderColor: "#1f2937",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      opacity: manageBusy ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}
                    >
                      Edit Reel
                    </Text>
                    <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
                      Update caption, music, or visibility
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={manageBusy}
                    onPress={() => void handleManageDelete()}
                    style={{
                      borderWidth: 1,
                      borderColor: "#7f1d1d",
                      backgroundColor: "#3f1d1d",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      opacity: manageBusy ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}
                    >
                      Delete Reel
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    disabled={manageBusy}
                    onPress={() => void handleHideReel()}
                    style={{
                      borderWidth: 1,
                      borderColor: "#1f2937",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      opacity: manageBusy ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}
                    >
                      Hide Reel
                    </Text>
                    <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
                      Remove this reel from your feed
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={manageBusy}
                    onPress={() => void handleReportReel()}
                    style={{
                      borderWidth: 1,
                      borderColor: "#7f1d1d",
                      backgroundColor: "#3f1d1d",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      opacity: manageBusy ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}
                    >
                      Report Reel
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Comment Modal */}
      {commentReelId && (() => {
        const commentReel = reels.find((r) => r.id === commentReelId);
        return (
          <ReelCommentModal
            visible={!!commentReelId}
            onClose={closeComments}
            reelId={commentReelId}
            likesCount={commentReel?.likesCount || 0}
            sharesCount={commentReel?.sharesCount || 0}
            currentUserName={currentUser?.name || "You"}
            currentUserAvatar={currentUser?.avatarUrl || ""}
            reelAuthorId={commentReel?.author.id || ""}
            onCommentsCountChange={handleCommentsCountChange}
          />
        );
      })()}
    </View>
  );
}
