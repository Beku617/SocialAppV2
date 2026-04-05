import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
} from "react-native";

export default function FeedLoadingScreen() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.1],
  });

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.42],
  });

  const coreScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 104,
          height: 104,
          borderRadius: 52,
          backgroundColor: "#312e81",
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />

      <Animated.View
        style={{
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: coreScale }],
        }}
      >
        <ActivityIndicator size="small" color="#4f46e5" />
      </Animated.View>
    </View>
  );
}
