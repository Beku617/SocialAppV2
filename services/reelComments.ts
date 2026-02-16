import { BASE_URL, getValidToken, type ApiResponse } from "./config";

// ─── Types ──────────────────────────────────────────────────────────────
export interface ReelCommentAuthor {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ReelComment {
  id: string;
  reelId: string;
  author: ReelCommentAuthor;
  text: string;
  parentCommentId: string | null;
  likesCount: number;
  dislikesCount: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  isAuthor: boolean;
  createdAt: string;
  replies: ReelComment[];
}

// ─── Helpers ────────────────────────────────────────────────────────────
const getAuthHeaders = async (withJson = false) => {
  const token = await getValidToken();
  if (!token) return { error: "Session expired. Please sign in again." as const };
  return {
    headers: {
      ...(withJson ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
  };
};

// ─── API ────────────────────────────────────────────────────────────────

export async function fetchReelComments(
  reelId: string,
): Promise<ApiResponse<{ comments: ReelComment[]; totalCount: number }>> {
  try {
    const auth = await getAuthHeaders();
    if ("error" in auth) return { error: auth.error };

    const res = await fetch(`${BASE_URL}/api/reels/${reelId}/comments`, {
      headers: auth.headers,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to fetch comments" };
    return { data: { comments: json.comments, totalCount: json.totalCount } };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function addReelComment(
  reelId: string,
  text: string,
  parentCommentId?: string | null,
): Promise<
  ApiResponse<{ comment: ReelComment; commentsCount: number }>
> {
  try {
    const auth = await getAuthHeaders(true);
    if ("error" in auth) return { error: auth.error };

    const body: any = { text };
    if (parentCommentId) body.parentCommentId = parentCommentId;

    const res = await fetch(`${BASE_URL}/api/reels/${reelId}/comments`, {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to add comment" };
    return { data: { comment: json.comment, commentsCount: json.commentsCount } };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function likeReelComment(
  reelId: string,
  commentId: string,
): Promise<
  ApiResponse<{ liked: boolean; likesCount: number; dislikesCount: number }>
> {
  try {
    const auth = await getAuthHeaders();
    if ("error" in auth) return { error: auth.error };

    const res = await fetch(
      `${BASE_URL}/api/reels/${reelId}/comments/${commentId}/like`,
      { method: "POST", headers: auth.headers },
    );
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to like comment" };
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function dislikeReelComment(
  reelId: string,
  commentId: string,
): Promise<
  ApiResponse<{ disliked: boolean; likesCount: number; dislikesCount: number }>
> {
  try {
    const auth = await getAuthHeaders();
    if ("error" in auth) return { error: auth.error };

    const res = await fetch(
      `${BASE_URL}/api/reels/${reelId}/comments/${commentId}/dislike`,
      { method: "POST", headers: auth.headers },
    );
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to dislike comment" };
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export async function deleteReelComment(
  reelId: string,
  commentId: string,
): Promise<ApiResponse<{ message: string; commentsCount: number }>> {
  try {
    const auth = await getAuthHeaders();
    if ("error" in auth) return { error: auth.error };

    const res = await fetch(
      `${BASE_URL}/api/reels/${reelId}/comments/${commentId}`,
      { method: "DELETE", headers: auth.headers },
    );
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to delete comment" };
    return { data: json };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
