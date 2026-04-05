import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";

import { registerPushToken } from "../services/api";
import { useColorScheme } from "../hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let disposed = false;

    async function initNotifications() {
      try {
        const {
          getNotificationsModule,
          registerForPushNotificationsAsync,
          setupNotificationChannel,
        } = await import("../notifications");

        const Notifications = await getNotificationsModule();
        if (!Notifications || disposed) return;

        await setupNotificationChannel();
        const expoPushToken = await registerForPushNotificationsAsync();
        if (disposed) return;

        if (expoPushToken) {
          await registerPushToken(expoPushToken);
        }

        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as
              | {
                  type?: string;
                  userId?: string;
                  userName?: string;
                }
              | undefined;

            if (data?.type === "dm" && typeof data.userId === "string") {
              router.push({
                pathname: "/(dashboard)/messages",
                params: {
                  userId: data.userId,
                  userName:
                    typeof data.userName === "string" ? data.userName : "",
                },
              });
              return;
            }

            if (
              data?.type === "post_like" ||
              data?.type === "post_comment"
            ) {
              router.push("/(dashboard)/notifications");
              return;
            }

            console.log("Notification tapped:", response);
          });
      } catch (error) {
        console.warn("[notifications] init failed:", error);
      }
    }

    void initNotifications();

    return () => {
      disposed = true;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-reel"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="edit-post/[postId]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="settings-activity"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
