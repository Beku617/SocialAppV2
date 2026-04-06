import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MultiImageGridProps = {
  images: string[];
  height: number;
  borderRadius?: number;
  singleImageResizeMode?: "cover" | "contain";
  multiImageResizeMode?: "cover" | "contain";
  viewerTitle?: string;
  viewerSubtitle?: string;
  viewerShowPostChrome?: boolean;
};

const TILE_GAP = 4;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_ANIMATION_MS = 180;

export default function MultiImageGrid({
  images,
  height,
  borderRadius = 24,
  singleImageResizeMode = "cover",
  multiImageResizeMode = "contain",
  viewerTitle = "",
  viewerSubtitle = "",
  viewerShowPostChrome = false,
}: MultiImageGridProps) {
  const insets = useSafeAreaInsets();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOverlayVisible, setViewerOverlayVisible] = useState(true);
  const viewerScrollRef = useRef<ScrollView | null>(null);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOverlayVisible(true);
    overlayOpacity.setValue(1);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
  };

  useEffect(() => {
    if (!viewerVisible) return;

    requestAnimationFrame(() => {
      viewerScrollRef.current?.scrollTo({
        x: viewerIndex * SCREEN_WIDTH,
        animated: false,
      });
    });
  }, [viewerVisible, viewerIndex]);

  if (images.length === 0) {
    return null;
  }

  const previewImages = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - 4);

  const handleViewerScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
    );
    setViewerIndex(nextIndex);
  };

  const animateOverlay = (visible: boolean) => {
    Animated.timing(overlayOpacity, {
      toValue: visible ? 1 : 0,
      duration: OVERLAY_ANIMATION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const toggleViewerOverlay = () => {
    const nextVisible = !viewerOverlayVisible;
    setViewerOverlayVisible(nextVisible);
    animateOverlay(nextVisible);
  };

  const renderTile = (
    imageUrl: string,
    index: number,
    style?: ViewStyle,
    overlayLabel?: string,
  ) => (
    <TouchableOpacity
      key={`image-tile-${index}`}
      activeOpacity={0.92}
      onPress={() => openViewer(index)}
      style={[
        {
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          backgroundColor: "#1f2937",
        },
        style,
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: "100%" }}
        resizeMode={
          images.length > 1 ? multiImageResizeMode : singleImageResizeMode
        }
      />
      {overlayLabel ? (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.48)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 34,
              fontWeight: "700",
            }}
          >
            {overlayLabel}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderPreview = () => {
    if (previewImages.length === 1) {
      return renderTile(previewImages[0], 0);
    }

    if (previewImages.length === 2) {
      return (
        <View style={{ flex: 1, flexDirection: "row", gap: TILE_GAP }}>
          {renderTile(previewImages[0], 0)}
          {renderTile(previewImages[1], 1)}
        </View>
      );
    }

    if (previewImages.length === 3) {
      return (
        <View style={{ flex: 1, flexDirection: "row", gap: TILE_GAP }}>
          <View style={{ flex: 1, gap: TILE_GAP }}>
            {renderTile(previewImages[0], 0)}
            {renderTile(previewImages[1], 1)}
          </View>
          {renderTile(previewImages[2], 2)}
        </View>
      );
    }

    return (
      <View style={{ flex: 1, gap: TILE_GAP }}>
        <View style={{ flex: 1, flexDirection: "row", gap: TILE_GAP }}>
          {renderTile(previewImages[0], 0)}
          {renderTile(previewImages[1], 1)}
        </View>
        <View style={{ flex: 1, flexDirection: "row", gap: TILE_GAP }}>
          {renderTile(previewImages[2], 2)}
          {renderTile(
            previewImages[3],
            3,
            undefined,
            extraCount > 0 ? `+${extraCount}` : undefined,
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          height,
          borderRadius,
          overflow: "hidden",
          backgroundColor: "#111827",
        }}
      >
        {renderPreview()}
      </View>

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(2, 6, 23, 0.98)",
          }}
        >
          <ScrollView
            ref={viewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleViewerScrollEnd}
            decelerationRate="fast"
            bounces={false}
            style={{ flex: 1 }}
          >
            {images.map((imageUrl, index) => (
              <Pressable
                key={`viewer-image-${index}`}
                onPress={toggleViewerOverlay}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                  }}
                  resizeMode="contain"
                />
              </Pressable>
            ))}
          </ScrollView>

          <Animated.View
            pointerEvents={viewerOverlayVisible ? "box-none" : "none"}
            style={{
              position: "absolute",
              inset: 0,
              opacity: overlayOpacity,
            }}
          >
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                top: Math.max(insets.top + 4, 8),
                left: 12,
                right: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={closeViewer}
                style={{
                  width: 36,
                  height: 36,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>

              {viewerShowPostChrome ? (
                images.length > 1 ? (
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 18 }}
                  >
                    <Ionicons name="pricetag-outline" size={23} color="#fff" />
                    <Ionicons name="location-outline" size={23} color="#fff" />
                    <Ionicons name="ellipsis-vertical" size={23} color="#fff" />
                  </View>
                ) : null
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {viewerIndex + 1} / {images.length}
                </Text>
              )}
            </View>

            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: Math.max(insets.bottom + 10, 14),
              }}
            >
              {viewerShowPostChrome ? (
                images.length > 1 ? (
                  <>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {viewerTitle}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.82)",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        {viewerSubtitle}
                      </Text>
                      <Ionicons
                        name="lock-closed-outline"
                        size={12}
                        color="rgba(255,255,255,0.78)"
                      />
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 18,
                        marginTop: 14,
                      }}
                    >
                      <Ionicons name="thumbs-up-outline" size={29} color="#fff" />
                      <Ionicons name="chatbubble-outline" size={29} color="#fff" />
                    </View>
                  </>
                ) : null
              ) : (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                  }}
                >
                  Swipe left or right to view more
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
