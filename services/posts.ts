import {
  BASE_URL,
  getValidToken,
  type ApiResponse,
  type Comment,
  type Post,
} from "./config";

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
