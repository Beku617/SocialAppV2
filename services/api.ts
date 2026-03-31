// ─── Barrel file ────────────────────────────────────────────────────────
// Re-exports everything so existing imports from "../../services/api" keep working.

// Config, token helpers & shared types
export {
  clearAuth,
  getToken,
  getUser,
  getValidToken,
  saveAuth,
  type AuthUser,
  type BanInfo,
  type ApiResponse,
  type Comment,
  type Post,
  type PostAuthor,
  type UserRole,
} from "./config";

// Auth & profile management
export {
  changePassword,
  deleteAccount,
  getMe,
  loginUser,
  registerUser,
  updateProfile,
  type UserProfile,
} from "./auth";

// Session helpers
export { getHomeRouteForUser, resolveSessionUser } from "./session";

// Admin
export {
  banAdminUser,
  createAdminPost,
  createAdminReel,
  deleteAdminPost,
  deleteAdminReel,
  deleteAdminUser,
  fetchAdminPostDetails,
  fetchAdminPosts,
  fetchAdminReelDetails,
  fetchAdminReels,
  fetchAdminSummary,
  fetchAdminUserDetails,
  fetchAdminUsers,
  unbanAdminUser,
  type AdminPost,
  type AdminReel,
  type AdminSummary,
  type AdminUser,
  type AdminUserDetailsResponse,
  type BanDuration,
} from "./admin";

// Posts
export {
  addComment,
  createPost,
  deletePost,
  fetchPostDetails,
  fetchPosts,
  seedPosts,
  toggleLike,
  updatePost,
} from "./posts";

// Stories
export {
  createStory,
  deleteStory,
  fetchStories,
  viewStory,
  type StoryGroup,
  type StoryItem,
} from "./stories";

// Users, search & follow
export {
  getFollowersList,
  getFollowingList,
  getUserProfile,
  searchUsers,
  toggleFollow,
  type PublicUserProfile,
  type SearchUserResult,
  type UserProfileResponse,
} from "./users";

// Messaging
export {
  getConversations,
  getMessages,
  sendMessage,
  type ChatMessage,
  type ConversationItem,
} from "./messages";

// Reels
export {
  completeReelUpload,
  deleteReel,
  fetchMyReels,
  fetchReels,
  initiateReelUpload,
  markReelFailed,
  markReelReady,
  uploadReelVideoLocal,
  seedReels,
  toggleReelLike,
  toggleReelSave,
  updateReel,
  viewReel,
  type Reel,
  type ReelStatus,
  type ReelTab,
  type ReelUploadInitPayload,
  type ReelUploadInitResponse,
  type ReelVisibility,
  type ReelLocalUploadPayload,
} from "./reels";

// Reel Comments
export {
  addReelComment,
  deleteReelComment,
  dislikeReelComment,
  fetchReelComments,
  likeReelComment,
  type ReelComment as ReelCommentType,
  type ReelCommentAuthor,
} from "./reelComments";
