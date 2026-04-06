import {
  BASE_URL,
  getValidToken,
  type ApiResponse,
  type Comment,
  type Post,
  type PostVisibility,
} from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_POST_IDS_KEY = "saved_post_ids";
const HIDDEN_POST_IDS_KEY = "hidden_post_ids";
const SNOOZED_AUTHOR_IDS_KEY = "snoozed_author_ids";
const POST_SHARE_PREFIX = "connect://post/";
const POST_ID_PATTERN = "[a-f0-9]{24}";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type SnoozedAuthorEntry = {
  userId: string;
  expiresAt: number;
};

const normalizeComment = (raw: any): Comment => {
  const rawAuthor = raw?.author;
  const authorId =
    (typeof rawAuthor?.id === "string" && rawAuthor.id) ||
    (typeof rawAuthor?._id === "string" && rawAuthor._id) ||
    (typeof rawAuthor === "string" ? rawAuthor : "");

  return {
    id:
      (typeof raw?.id === "string" && raw.id) ||
      (typeof raw?._id === "string" && raw._id) ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: {
      id: authorId,
      name:
        (typeof rawAuthor?.name === "string" && rawAuthor.name.trim()) ||
        "Unknown user",
      avatarUrl:
        typeof rawAuthor?.avatarUrl === "string" ? rawAuthor.avatarUrl : "",
    },
    text: typeof raw?.text === "string" ? raw.text : "",
    createdAt:
      typeof raw?.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
  };
};

export function buildPostShareToken(postId: string): string {
  return `${POST_SHARE_PREFIX}${postId}`;
}

export function resolvePostIdFromShareValue(value: string): string | null {
  const normalized = String(value || "").trim();
  if (!normalized) return null;

  const prefixedPatterns = [
    new RegExp(`^connect:\\/\\/post\\/(${POST_ID_PATTERN})(?:[/?#].*)?$`, "i"),
    new RegExp(`^connect-post:(${POST_ID_PATTERN})$`, "i"),
    new RegExp(`^post:(${POST_ID_PATTERN})$`, "i"),
  ];

  for (const pattern of prefixedPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  const legacyWebMatch = normalized.match(
    new RegExp(`/posts/(${POST_ID_PATTERN})(?:[/?#]|$)`, "i"),
  );
  if (legacyWebMatch?.[1]) {
    return legacyWebMatch[1];
  }

  if (new RegExp(`^${POST_ID_PATTERN}$`, "i").test(normalized)) {
    return normalized;
  }

  return null;
}

// ─── Posts ───────────────────────────────────────────────────────────────
export async function fetchPosts(): Promise<ApiResponse<Post[]>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
  visibility?: PostVisibility,
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
        visibility: visibility || "public",
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
  visibility?: PostVisibility,
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
        visibility,
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
    return { data: normalizeComment(json.comment) };
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

export async function reportPost(
  postId: string,
  reason: string,
  description?: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason,
        description: typeof description === "string" ? description.trim() : "",
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to submit report" };
    }
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function sharePost(
  postId: string,
  text: string,
  visibility: PostVisibility = "public",
): Promise<ApiResponse<Post>> {
  try {
    const token = await getValidToken();
    if (!token) return { error: "Session expired. Please sign in again." };

    const response = await fetch(`${BASE_URL}/api/posts/${postId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        visibility,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      return { error: json.message || "Failed to share post" };
    }
    return { data: json.post };
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

async function loadSnoozedAuthorEntries(): Promise<SnoozedAuthorEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SNOOZED_AUTHOR_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const normalized: SnoozedAuthorEntry[] = [];
    const seen = new Set<string>();

    for (const entry of parsed) {
      const userId =
        entry && typeof entry.userId === "string" ? entry.userId : "";
      const expiresAt =
        entry && Number.isFinite(entry.expiresAt) ? Number(entry.expiresAt) : 0;

      if (!userId || expiresAt <= now || seen.has(userId)) {
        continue;
      }

      seen.add(userId);
      normalized.push({ userId, expiresAt });
    }

    if (normalized.length !== parsed.length) {
      await AsyncStorage.setItem(
        SNOOZED_AUTHOR_IDS_KEY,
        JSON.stringify(normalized),
      );
    }

    return normalized;
  } catch {
    return [];
  }
}

export async function getSnoozedAuthorIds(): Promise<string[]> {
  const entries = await loadSnoozedAuthorEntries();
  return entries.map((entry) => entry.userId);
}

export async function snoozeAuthorFor30Days(userId: string): Promise<void> {
  if (!userId) return;

  const entries = await loadSnoozedAuthorEntries();
  const expiresAt = Date.now() + THIRTY_DAYS_MS;
  const nextEntries = entries.filter((entry) => entry.userId !== userId);
  nextEntries.push({ userId, expiresAt });

  await AsyncStorage.setItem(
    SNOOZED_AUTHOR_IDS_KEY,
    JSON.stringify(nextEntries),
  );
}
