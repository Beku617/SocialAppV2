import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BASE_URL,
  getValidToken,
  saveAuth,
  type ApiResponse,
  type AuthUser,
  type BanInfo,
} from "./config";

const USER_KEY = "auth_user";

// ─── Types ──────────────────────────────────────────────────────────────
interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface UserProfile extends AuthUser {
  createdAt: string;
  followersCount: number;
  followingCount: number;
  ban?: BanInfo;
}

// ─── Auth ───────────────────────────────────────────────────────────────
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMsg =
        json.message ||
        json.error ||
        (json.details ? JSON.stringify(json.details) : null) ||
        `Registration failed (HTTP ${response.status})`;
      return { error: errorMsg };
    }

    await saveAuth(json.token, json.user);
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error – is the server running?" };
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMsg =
        json.message || json.error || `Login failed (HTTP ${response.status})`;
      return { error: errorMsg };
    }

    await saveAuth(json.token, json.user);
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error – is the server running?" };
  }
}

// ─── Profile ────────────────────────────────────────────────────────────
export async function getMe(): Promise<ApiResponse<UserProfile>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Not authenticated" };

    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to fetch profile" };
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(json.user));
    return { data: json.user };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function updateProfile(updates: {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<ApiResponse<UserProfile>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Not authenticated" };

    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to update profile" };
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(json.user));
    return { data: json.user };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Not authenticated" };

    const response = await fetch(`${BASE_URL}/api/auth/me/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to change password" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function deleteAccount(): Promise<
  ApiResponse<{ message: string }>
> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Not authenticated" };

    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to delete account" };
    }
    const { clearAuth } = await import("./config");
    await clearAuth();
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
