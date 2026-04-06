import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Alert, Platform } from "react-native";

let hasLoggedExpoGoPushNotice = false;

// Backup-aligned notification handler behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getNotificationsModule() {
  if (Platform.OS === "web") return null;
  return Notifications;
}

// Create Android notification channel
export async function setupNotificationChannel() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  } catch (error) {
    console.warn("[notifications] setup channel failed:", error);
  }
}

// Ask user for permission + fetch expo token for DM remote push
export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      Alert.alert("Use a real Android device for notification testing");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Notification permission was denied");
      return null;
    }

    const appOwnership = (Constants as any).appOwnership;
    const runningInExpoGo =
      Constants.executionEnvironment === "storeClient" ||
      appOwnership === "expo";

    // SDK 53: Expo Go should not be used for remote push token registration.
    if (runningInExpoGo) {
      if (!hasLoggedExpoGoPushNotice) {
        console.log(
          "[notifications] Expo Go detected. Remote push requires a development build; local notifications remain enabled.",
        );
        hasLoggedExpoGoPushNotice = true;
      }
      return null;
    }

    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.expoConfig?.extra?.projectId;

    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenResponse.data || null;
  } catch (error) {
    console.warn("[notifications] register permission failed:", error);
    return null;
  }
}

type LocalNotificationOptions = {
  title?: string;
  body?: string;
  data?: Record<string, any>;
};

// Local test notification (also reused for DM alerts)
export async function sendLocalNotification(options: LocalNotificationOptions = {}) {
  await setupNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: options.title ?? "Test Notification",
      body:
        options.body ??
        "Hi. It is Beku. This is a test notification.",
      data: options.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: "messages",
    },
  });
}
