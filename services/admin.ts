import {
  BASE_URL,
  getValidToken,
  type ApiResponse,
  type BanInfo,
  type Post,
  type UserRole,
} from "./config";
import * as FileSystem from "expo-file-system/legacy";
import { type Reel, type ReelVisibility } from "./reels";

export type BanDuration = "1d" | "3d" | "7d" | "30d" | "forever";

export interface AdminSummary {
  totalUsers: number;
  totalPosts: number;
  totalReels: number;
  bannedUsers: number;
  recentActivity: {
    id: string;
    type: "user" | "post" | "reel";
    title: string;
    subtitle: string;
    createdAt: string;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postCount: number;
  ban: BanInfo;
  canManage: boolean;
}

export interface AdminUserDetailsResponse {
  user: AdminUser;
  recentPosts: AdminPost[];
}

export interface AdminPost extends Post {
  status: "published";
  caption: string;
  likeCount: number;
  commentCount: number;
}

export type AdminReel = Reel;

const getAdminHeaders = async (includeJson = false) => {
  const token = await getValidToken();
  if (!token) {
    return null;
  }

  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
};

export async function fetchAdminSummary(): Promise<ApiResponse<AdminSummary>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/summary`, { headers });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load admin summary" };
    }

    return { data: json.summary };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/users`, { headers });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load users" };
    }

    return { data: json.users };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchAdminUserDetails(
  userId: string,
): Promise<ApiResponse<AdminUserDetailsResponse>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load user details" };
    }

    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function banAdminUser(
  userId: string,
  duration: BanDuration,
): Promise<ApiResponse<AdminUser>> {
  try {
    const headers = await getAdminHeaders(true);
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/ban`, {
      method: "POST",
      headers,
      body: JSON.stringify({ duration }),
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to ban user" };
    }

    return { data: json.user };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function unbanAdminUser(
  userId: string,
): Promise<ApiResponse<AdminUser>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/unban`, {
      method: "POST",
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to unban user" };
    }

    return { data: json.user };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function deleteAdminUser(
  userId: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to delete user" };
    }

    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchAdminPosts(): Promise<ApiResponse<AdminPost[]>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/posts`, { headers });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load posts" };
    }

    return { data: json.posts };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchAdminPostDetails(
  postId: string,
): Promise<ApiResponse<AdminPost>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/posts/${postId}`, {
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load post details" };
    }

    return { data: json.post };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function createAdminPost(
  text: string,
  imageUrls: string[],
): Promise<ApiResponse<AdminPost>> {
  try {
    const headers = await getAdminHeaders(true);
    if (!headers) return { error: "Session expired. Please sign in again." };

    const normalizedImageUrls = imageUrls.filter(
      (imageUrl): imageUrl is string =>
        typeof imageUrl === "string" && imageUrl.trim().length > 0,
    );

    const response = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text,
        imageUrl: normalizedImageUrls[0] || "",
        imageUrls: normalizedImageUrls,
      }),
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to create post" };
    }

    return { data: json.post };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function deleteAdminPost(
  postId: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/posts/${postId}`, {
      method: "DELETE",
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to delete post" };
    }

    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchAdminReels(): Promise<ApiResponse<AdminReel[]>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/reels`, { headers });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load reels" };
    }

    return { data: json.reels };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchAdminReelDetails(
  reelId: string,
): Promise<ApiResponse<AdminReel>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/reels/${reelId}`, {
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to load reel details" };
    }

    return { data: json.reel };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function createAdminReel(payload: {
  caption?: string;
  music?: string;
  visibility?: ReelVisibility;
  fileUri: string;
  mimeType?: string;
  fileName?: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbUrl?: string;
}): Promise<ApiResponse<AdminReel>> {
  try {
    const headers = await getAdminHeaders(true);
    if (!headers) return { error: "Session expired. Please sign in again." };

    const base64Data = await FileSystem.readAsStringAsync(payload.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(`${BASE_URL}/api/admin/reels`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        caption: payload.caption || "",
        music: payload.music || "",
        visibility: payload.visibility || "public",
        base64Data,
        mimeType: payload.mimeType || "video/mp4",
        fileName: payload.fileName || "original.mp4",
        duration: payload.duration || 0,
        width: payload.width || 0,
        height: payload.height || 0,
        thumbUrl: payload.thumbUrl || "",
      }),
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to create reel" };
    }

    return { data: json.reel };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function deleteAdminReel(
  reelId: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const headers = await getAdminHeaders();
    if (!headers) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/admin/reels/${reelId}`, {
      method: "DELETE",
      headers,
    });
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to delete reel" };
    }

    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
