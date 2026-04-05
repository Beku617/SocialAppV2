import { BASE_URL, getValidToken, type ApiResponse } from "./config";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<
  ApiResponse<AppNotification[]>
> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to load notifications" };
    }
    return { data: json.notifications || [] };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ApiResponse<AppNotification>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/notifications/${notificationId}/read`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to mark notification as read" };
    }
    return { data: json.notification };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function markAllNotificationsRead(): Promise<
  ApiResponse<{ ok: boolean }>
> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to mark notifications as read" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
