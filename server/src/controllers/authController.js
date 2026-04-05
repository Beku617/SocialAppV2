const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createHttpError } = require("../utils/httpError");
const { generateToken } = require("../utils/generateToken");
const { serializePost } = require("../utils/serializePost");
const { buildBanSnapshot, ensureUserCanAccess } = require("../utils/userAccess");
const { isExpoPushToken } = require("../utils/pushNotifications");

const buildUsernameBase = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, "")
    .slice(0, 24);

  return normalized || `user${Date.now().toString().slice(-6)}`;
};

const createUniqueUsername = async (name, email) => {
  const base = buildUsernameBase(email.split("@")[0] || name);
  let candidate = base;
  let suffix = 1;

  while (await User.exists({ username: candidate })) {
    candidate = `${base}${suffix}`.slice(0, 30);
    suffix += 1;
  }

  return candidate;
};

const buildAuthUserPayload = (user) => ({
  ...user.toJSON(),
  ban: buildBanSnapshot(user),
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw createHttpError(409, "Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const username = await createUniqueUsername(name, normalizedEmail);
    const user = await User.create({
      name,
      email: normalizedEmail,
      username,
      passwordHash,
      role: "user",
    });
    const token = generateToken(user._id.toString());

    return res.status(201).json({
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const identifier = String(email || "").trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      throw createHttpError(401, "Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw createHttpError(401, "Invalid email or password");
    }

    await ensureUserCanAccess(user);
    const token = generateToken(user._id.toString());
    return res.status(200).json({
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res) => {
  const user = req.user;
  const json = buildAuthUserPayload(user);
  json.followersCount = user.followers ? user.followers.length : 0;
  json.followingCount = user.following ? user.following.length : 0;
  return res.status(200).json({ user: json });
};

const savePushToken = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!isExpoPushToken(token)) {
      throw createHttpError(400, "Invalid push token");
    }

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { expoPushTokens: token } },
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();
    return res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      throw createHttpError(400, "Current password is incorrect");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.status(200).json({ message: "Password updated" });
  } catch (error) {
    return next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    throw createHttpError(403, "Deleting your account is not allowed");
  } catch (error) {
    return next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(200).json({ users: [] });
    }

    const regex = new RegExp(q.trim(), "i");
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
    })
      .select("name avatarUrl bio")
      .limit(20)
      .lean();

    const result = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      avatarUrl: u.avatarUrl || "",
      bio: u.bio || "",
    }));

    return res.status(200).json({ users: result });
  } catch (error) {
    return next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const Post = require("../models/Post");
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "name avatarUrl")
      .populate("comments.author", "name avatarUrl")
      .lean();

    const postCount = posts.length;
    const followersCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;
    const isFollowing = user.followers
      ? user.followers.some((id) => id.toString() === req.user._id.toString())
      : false;

    const json = user.toJSON();
    json.followersCount = followersCount;
    json.followingCount = followingCount;
    json.ban = buildBanSnapshot(user);

    return res.status(200).json({
      user: json,
      posts: posts.map(serializePost),
      postCount,
      isFollowing,
    });
  } catch (error) {
    return next(error);
  }
};

const toggleFollow = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    if (currentUserId.toString() === targetUserId) {
      throw createHttpError(400, "Cannot follow yourself");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw createHttpError(404, "User not found");
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString(),
    );

    if (isFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString(),
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId,
      );
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    return res.status(200).json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (error) {
    return next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "followers",
      "name avatarUrl bio",
    );
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const followers = (user.followers || []).map((u) => ({
      id: u._id.toString(),
      name: u.name,
      avatarUrl: u.avatarUrl || "",
      bio: u.bio || "",
    }));

    return res.status(200).json({ users: followers });
  } catch (error) {
    return next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "following",
      "name avatarUrl bio",
    );
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const following = (user.following || []).map((u) => ({
      id: u._id.toString(),
      name: u.name,
      avatarUrl: u.avatarUrl || "",
      bio: u.bio || "",
    }));

    return res.status(200).json({ users: following });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  savePushToken,
  updateProfile,
  changePassword,
  deleteAccount,
  searchUsers,
  getUserProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
};
