import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

// Controls how notifications appear when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

// Ask user for permission
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

    return true;
  } catch (error) {
    console.warn("[notifications] register permission failed:", error);
    return null;
  }
}

// Local test notification
export async function sendLocalNotification() {
  await setupNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: "Hi. It is Beku. This is a test notification.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: "messages",
    },
  });
}
