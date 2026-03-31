import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AdminFeedbackToastProps = {
  visible: boolean;
  title: string;
  message: string;
  onHide: () => void;
};

export default function AdminFeedbackToast({
  visible,
  title,
  message,
  onHide,
}: AdminFeedbackToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(12);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onHide();
        }
      });
    }, 1600);

    return () => {
      clearTimeout(timeout);
    };
  }, [message, onHide, opacity, title, translateY, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        bottom: Math.max(insets.bottom + 14, 18),
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#dcfce7",
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#ecfdf5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="checkmark" size={18} color="#059669" />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#111827",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: 13,
              color: "#6b7280",
              lineHeight: 19,
            }}
          >
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
