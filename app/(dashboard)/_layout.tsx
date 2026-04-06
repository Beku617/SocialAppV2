import { Ionicons } from "@expo/vector-icons";
import {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import { router, usePathname, withLayoutContext } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DASHBOARD_NAV_THEME } from "../../constants/navigation-theme";
import {
  fetchNotifications,
  getConversations,
  getHomeRouteForUser,
  getValidToken,
  resolveSessionUser,
} from "../../services/api";

const { Navigator } = createBottomTabNavigator();

const DashboardTabs = withLayoutContext<
  BottomTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  BottomTabNavigationEventMap
>(Navigator, undefined, true);

export default function DashboardLayout() {
  const pathname = usePathname();
  const onMessagesScreen = pathname.startsWith("/(dashboard)/messages");
  const onNotificationsScreen = pathname.startsWith("/(dashboard)/notifications");
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "ios"
      ? DASHBOARD_NAV_THEME.iosExtraBottomInset
      : DASHBOARD_NAV_THEME.androidExtraBottomInset,
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageBadgeCount, setMessageBadgeCount] = useState(0);
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);
  const seenConversationMessageIdsRef = useRef<Map<string, string>>(new Map());
  const unseenMessageIdsRef = useRef<Set<string>>(new Set());
  const messageBaselineReadyRef = useRef(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const unseenNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationBaselineReadyRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const token = await getValidToken();
      if (!mounted) return;

      if (!token) {
        router.replace("/(tabs)");
        return;
      }

      const sessionUser = await resolveSessionUser();
      if (!mounted) return;

      if (sessionUser?.role === "admin") {
        router.replace(getHomeRouteForUser(sessionUser) as any);
        return;
      }

      setCurrentUserId(sessionUser?.id || null);
      setAuthChecked(true);
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(
        DASHBOARD_NAV_THEME.androidSystemNavigationColor,
      ).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!onMessagesScreen) return;
    let cancelled = false;

    const resetMessageBaseline = async () => {
      const conversationsResult = await getConversations();
      if (cancelled || !conversationsResult.data) return;

      const nextSeenMap = new Map<string, string>();
      for (const conversation of conversationsResult.data) {
        const latestMessageId = conversation.lastMessage?.id;
        if (latestMessageId) {
          nextSeenMap.set(conversation.user.id, latestMessageId);
        }
      }
      seenConversationMessageIdsRef.current = nextSeenMap;
      unseenMessageIdsRef.current.clear();
      messageBaselineReadyRef.current = true;
      setMessageBadgeCount(0);
    };

    void resetMessageBaseline();

    return () => {
      cancelled = true;
    };
  }, [onMessagesScreen]);

  useEffect(() => {
    if (!onNotificationsScreen) return;
    let cancelled = false;

    const resetNotificationBaseline = async () => {
      const notificationsResult = await fetchNotifications();
      if (cancelled || !notificationsResult.data) return;

      seenNotificationIdsRef.current = new Set(
        notificationsResult.data.map((item) => item.id),
      );
      unseenNotificationIdsRef.current.clear();
      notificationBaselineReadyRef.current = true;
      setNotificationBadgeCount(0);
    };

    void resetNotificationBaseline();

    return () => {
      cancelled = true;
    };
  }, [onNotificationsScreen]);

  const clearMessageBadgeOnPress = useCallback(() => {
    setMessageBadgeCount(0);
    unseenMessageIdsRef.current.clear();
  }, []);

  const clearNotificationBadgeOnPress = useCallback(() => {
    setNotificationBadgeCount(0);
    unseenNotificationIdsRef.current.clear();
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncBadges = async () => {
      if (!mounted) return;

      if (onMessagesScreen) {
        setMessageBadgeCount(0);
      } else {
        const conversationsResult = await getConversations();
        if (!mounted) return;
        if (conversationsResult.data) {
          if (!messageBaselineReadyRef.current) {
            const initialSeenMap = new Map<string, string>();
            for (const conversation of conversationsResult.data) {
              const latestMessageId = conversation.lastMessage?.id;
              if (latestMessageId) {
                initialSeenMap.set(conversation.user.id, latestMessageId);
              }
            }
            seenConversationMessageIdsRef.current = initialSeenMap;
            unseenMessageIdsRef.current.clear();
            messageBaselineReadyRef.current = true;
            setMessageBadgeCount(0);
          } else {
            const seenMap = seenConversationMessageIdsRef.current;
            const unseenIds = unseenMessageIdsRef.current;

            for (const conversation of conversationsResult.data) {
              const latestMessageId = conversation.lastMessage?.id;
              if (!latestMessageId) continue;

              const previousMessageId = seenMap.get(conversation.user.id);
              const isIncoming =
                !currentUserId ||
                conversation.lastMessage.senderId !== currentUserId;

              if (!previousMessageId) {
                if (isIncoming) {
                  unseenIds.add(latestMessageId);
                }
              } else if (previousMessageId !== latestMessageId && isIncoming) {
                unseenIds.add(latestMessageId);
              }

              seenMap.set(conversation.user.id, latestMessageId);
            }

            setMessageBadgeCount(unseenIds.size);
          }
        }
      }

      if (onNotificationsScreen) {
        setNotificationBadgeCount(0);
      } else {
        const notificationsResult = await fetchNotifications();
        if (!mounted) return;
        if (notificationsResult.data) {
          if (!notificationBaselineReadyRef.current) {
            seenNotificationIdsRef.current = new Set(
              notificationsResult.data.map((item) => item.id),
            );
            unseenNotificationIdsRef.current.clear();
            notificationBaselineReadyRef.current = true;
            setNotificationBadgeCount(0);
          } else {
            const seenIds = seenNotificationIdsRef.current;
            const unseenIds = unseenNotificationIdsRef.current;
            const idsInResponse = new Set(
              notificationsResult.data.map((item) => item.id),
            );

            for (const notification of notificationsResult.data) {
              if (seenIds.has(notification.id)) continue;

              if (!notification.read) {
                unseenIds.add(notification.id);
              } else {
                seenIds.add(notification.id);
              }
            }

            for (const unseenId of Array.from(unseenIds)) {
              if (!idsInResponse.has(unseenId)) {
                unseenIds.delete(unseenId);
                seenIds.add(unseenId);
              }
            }

            setNotificationBadgeCount(unseenIds.size);
          }
        }
      }
    };

    void syncBadges();
    const interval = setInterval(() => {
      void syncBadges();
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentUserId, onMessagesScreen, onNotificationsScreen, pathname]);

  if (!authChecked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <DashboardTabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DASHBOARD_NAV_THEME.tabBarActiveTintColor,
        tabBarInactiveTintColor: DASHBOARD_NAV_THEME.tabBarInactiveTintColor,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarStyle: {
          backgroundColor: DASHBOARD_NAV_THEME.tabBarBackgroundColor,
          borderTopWidth: 1,
          borderTopColor: DASHBOARD_NAV_THEME.tabBarBorderColor,
          height: DASHBOARD_NAV_THEME.tabBarHeight + bottomInset,
          paddingTop: DASHBOARD_NAV_THEME.tabBarPaddingTop,
          paddingBottom: bottomInset,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <DashboardTabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <DashboardTabs.Screen
        name="videos"
        options={{
          title: "Reels",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "play-circle" : "play-circle-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <DashboardTabs.Screen
        name="messages"
        listeners={{
          tabPress: () => {
            clearMessageBadgeOnPress();
          },
        }}
        options={{
          title: "Messages",
          tabBarBadge:
            messageBadgeCount > 0 && !onMessagesScreen
              ? messageBadgeCount > 99
                ? "99+"
                : messageBadgeCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#ef4444",
            color: "#ffffff",
            fontWeight: "700",
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />
      <DashboardTabs.Screen
        name="notifications"
        listeners={{
          tabPress: () => {
            clearNotificationBadgeOnPress();
          },
        }}
        options={{
          title: "Notifications",
          tabBarBadge:
            notificationBadgeCount > 0 && !onNotificationsScreen
              ? notificationBadgeCount > 99
                ? "99+"
                : notificationBadgeCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#ef4444",
            color: "#ffffff",
            fontWeight: "700",
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <DashboardTabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </DashboardTabs>
  );
}
