import { BASE_URL, getValidToken, type ApiResponse, type Post } from "./config";
import { type Reel } from "./reels";

// ─── Types ──────────────────────────────────────────────────────────────
export interface SearchUserResult {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string;
  bio: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
}

export interface UserProfileResponse {
  user: PublicUserProfile;
  posts: Post[];
  reels: Reel[];
  postCount: number;
  isFollowing: boolean;
  isFriend: boolean;
  isOwnProfile: boolean;
  friendRequestPending: boolean;
  friendRequestIncoming: boolean;
}

// ─── Search Users ───────────────────────────────────────────────────────
export async function searchUsers(
  query: string,
): Promise<ApiResponse<SearchUserResult[]>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/search?q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Search failed" };
    }
    return { data: json.users };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

// ─── Get User Public Profile ────────────────────────────────────────────
export async function getUserProfile(
  userId: string,
): Promise<ApiResponse<UserProfileResponse>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/auth/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to load profile" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

// ─── Follow System ──────────────────────────────────────────────────────
export async function toggleFollow(
  userId: string,
): Promise<ApiResponse<{ isFollowing: boolean; followersCount: number }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/${userId}/follow`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to follow/unfollow" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function sendFriendRequest(
  userId: string,
): Promise<ApiResponse<{ status: "pending" | "friends"; followersCount?: number }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/${userId}/friend-request`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to send friend request" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function acceptFriendRequest(
  userId: string,
): Promise<ApiResponse<{ status: "accepted"; friendsCount: number }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/${userId}/friend-accept`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to accept friend request" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function unfriendUser(
  userId: string,
): Promise<ApiResponse<{ status: "unfriended"; friendsCount: number }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/${userId}/unfriend`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to unfriend user" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function blockUser(
  userId: string,
): Promise<ApiResponse<{ status: "blocked"; blockedUserId: string }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/auth/users/${userId}/block`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to block user" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function getFollowersList(
  userId: string,
): Promise<ApiResponse<SearchUserResult[]>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/${userId}/followers`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to load followers" };
    }
    return { data: json.users };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function getFollowingList(
  userId: string,
): Promise<ApiResponse<SearchUserResult[]>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(
      `${BASE_URL}/api/auth/users/${userId}/following`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to load following" };
    }
    return { data: json.users };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function getFriendsList(
  userId: string,
): Promise<ApiResponse<SearchUserResult[]>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/auth/users/${userId}/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to load friends" };
    }
    return { data: json.users };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
