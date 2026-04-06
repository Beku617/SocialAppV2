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
  type PostVisibility,
  type PostAuthor,
  type SharedPostSummary,
  type UserRole,
} from "./config";

// Auth & profile management
export {
  changePassword,
  deleteAccount,
  getMe,
  loginUser,
  registerPushToken,
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
  fetchAdminReports,
  fetchAdminReelDetails,
  fetchAdminReels,
  fetchAdminSummary,
  fetchAdminUserDetails,
  fetchAdminUsers,
  sendAdminNotification,
  unbanAdminUser,
  type AdminPost,
  type AdminReport,
  type AdminReel,
  type AdminSummary,
  type AdminUser,
  type AdminUserDetailsResponse,
  type BanDuration,
} from "./admin";

// Posts
export {
  addComment,
  buildPostShareToken,
  createPost,
  deletePost,
  fetchPostDetails,
  fetchPosts,
  getHiddenPostIds,
  getSavedPostIds,
  getSnoozedAuthorIds,
  hidePost,
  isPostSaved,
  resolvePostIdFromShareValue,
  reportPost,
  seedPosts,
  sharePost,
  snoozeAuthorFor30Days,
  togglePostNotifications,
  toggleSavedPost,
  toggleLike,
  updatePost,
} from "./posts";

// Notifications
export {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "./notifications";

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
  getFriendsList,
  getFollowingList,
  getUserProfile,
  blockUser,
  sendFriendRequest,
  acceptFriendRequest,
  unfriendUser,
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
  fetchSavedReels,
  fetchReelDetails,
  fetchMyReels,
  fetchReels,
  getHiddenReelIds,
  hideReel,
  initiateReelUpload,
  markReelFailed,
  markReelReady,
  reportReel,
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
