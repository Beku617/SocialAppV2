// ─── Barrel file ────────────────────────────────────────────────────────
// Re-exports everything so existing imports from "../../services/api" keep working.

// Config, token helpers & shared types
export {
  clearAuth,
  getToken,
  getUser,
  getValidToken,
  saveAuth,
  type ApiResponse,
  type Comment,
  type Post,
  type PostAuthor,
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

// Posts
export {
  addComment,
  createPost,
  deletePost,
  fetchPosts,
  seedPosts,
  toggleLike,
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
