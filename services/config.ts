import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// ─── Pick the right server URL per platform ─────────────────────────────
const getBaseUrl = (): string => {
  if (Platform.OS === "web") {
    return "http://localhost:4000";
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    console.log("[API] Detected dev host:", host);
    return `http://${host}:4000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }
  return "http://localhost:4000";
};

export const BASE_URL = getBaseUrl();
console.log(`[API] Platform: ${Platform.OS}, BASE_URL: ${BASE_URL}`);

// ─── Token helpers ──────────────────────────────────────────────────────
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const SESSION_EXPIRES_KEY = "auth_session_expires_at";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type UserRole = "user" | "admin";

export interface BanInfo {
  active: boolean;
  permanent: boolean;
  expiresAt: string | null;
  label: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  createdAt?: string;
  ban?: BanInfo;
}

export async function saveAuth(token: string, user: AuthUser) {
  const sessionExpiresAt = Date.now() + SESSION_DURATION_MS;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  await AsyncStorage.setItem(SESSION_EXPIRES_KEY, String(sessionExpiresAt));
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, SESSION_EXPIRES_KEY]);
}

export async function getValidToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const expiresRaw = await AsyncStorage.getItem(SESSION_EXPIRES_KEY);

  if (!token || !expiresRaw) {
    await clearAuth();
    return null;
  }

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    await clearAuth();
    return null;
  }

  return token;
}

// ─── Shared Types ───────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Comment {
  id: string;
  author: PostAuthor;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  text: string;
  imageUrl: string;
  imageUrls: string[];
  likes: string[];
  comments: Comment[];
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}
