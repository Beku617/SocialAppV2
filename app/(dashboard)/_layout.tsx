import { Ionicons } from "@expo/vector-icons";
import {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import { router, withLayoutContext } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DASHBOARD_NAV_THEME } from "../../constants/navigation-theme";
import {
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "ios"
      ? DASHBOARD_NAV_THEME.iosExtraBottomInset
      : DASHBOARD_NAV_THEME.androidExtraBottomInset,
  );
  const [authChecked, setAuthChecked] = useState(false);

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
        options={{
          title: "Messages",
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
        options={{
          title: "Notifications",
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
