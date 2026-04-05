import {
  BASE_URL,
  getValidToken,
  type ApiResponse,
  type Comment,
  type Post,
} from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_POST_IDS_KEY = "saved_post_ids";
const HIDDEN_POST_IDS_KEY = "hidden_post_ids";

// ─── Posts ───────────────────────────────────────────────────────────────
export async function fetchPosts(): Promise<ApiResponse<Post[]>> {
  try {
    const response = await fetch(`${BASE_URL}/api/posts`);
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to fetch posts" };
    }

    return { data: json.posts };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function fetchPostDetails(postId: string): Promise<ApiResponse<Post>> {
  try {
    const response = await fetch(`${BASE_URL}/api/posts/${postId}`);
    const json = await response.json();

    if (!response.ok) {
      return { error: json.message || "Failed to fetch post" };
    }

    return { data: json.post };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function createPost(
  text: string,
  imageUrls?: string[],
): Promise<ApiResponse<Post>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter(
          (imageUrl): imageUrl is string =>
            typeof imageUrl === "string" && imageUrl.trim().length > 0,
        )
      : [];

    const response = await fetch(`${BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

export async function updatePost(
  postId: string,
  text: string,
  imageUrls?: string[],
): Promise<ApiResponse<Post>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter(
          (imageUrl): imageUrl is string =>
            typeof imageUrl === "string" && imageUrl.trim().length > 0,
        )
      : [];

    const response = await fetch(`${BASE_URL}/api/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        imageUrl: normalizedImageUrls[0] || "",
        imageUrls: normalizedImageUrls,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to update post" };
    }
    return { data: json.post };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function toggleLike(
  postId: string,
): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to toggle like" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function addComment(
  postId: string,
  text: string,
): Promise<ApiResponse<Comment>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to add comment" };
    }
    return { data: json.comment };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function deletePost(
  postId: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export async function togglePostNotifications(
  postId: string,
): Promise<ApiResponse<{ notificationsEnabled: boolean }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}/notifications/toggle`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to update notifications" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

// ─── Seed (dev only) ────────────────────────────────────────────────────
export async function seedPosts(): Promise<ApiResponse<{ count: number }>> {
  try {
    const response = await fetch(`${BASE_URL}/api/posts/seed`, {
      method: "POST",
    });
    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to seed" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

// ─── Saved posts (local) ────────────────────────────────────────────────
export async function getSavedPostIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_POST_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

async function persistSavedPostIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  await AsyncStorage.setItem(SAVED_POST_IDS_KEY, JSON.stringify(uniqueIds));
}

export async function isPostSaved(postId: string): Promise<boolean> {
  const ids = await getSavedPostIds();
  return ids.includes(postId);
}

export async function toggleSavedPost(postId: string): Promise<boolean> {
  const ids = await getSavedPostIds();
  const alreadySaved = ids.includes(postId);

  if (alreadySaved) {
    await persistSavedPostIds(ids.filter((id) => id !== postId));
    return false;
  }

  await persistSavedPostIds([...ids, postId]);
  return true;
}

export async function getHiddenPostIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_POST_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function hidePost(postId: string): Promise<void> {
  const ids = await getHiddenPostIds();
  if (ids.includes(postId)) return;
  await AsyncStorage.setItem(
    HIDDEN_POST_IDS_KEY,
    JSON.stringify([...ids, postId]),
  );
}
