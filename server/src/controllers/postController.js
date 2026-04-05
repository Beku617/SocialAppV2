const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const { createHttpError } = require("../utils/httpError");
const { normalizeImageUrls, serializePost } = require("../utils/serializePost");
const { createUserNotification } = require("../utils/notificationCenter");
const bcrypt = require("bcryptjs");

const listPosts = async (_req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name avatarUrl")
      .populate("comments.author", "name avatarUrl")
      .lean();

    return res.status(200).json({ posts: posts.map(serializePost) });
  } catch (error) {
    return next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("author", "name avatarUrl")
      .populate("comments.author", "name avatarUrl")
      .lean();

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    return res.status(200).json({ post: serializePost(post) });
  } catch (error) {
    return next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const imageUrls = normalizeImageUrls(req.body);

    if (!text && imageUrls.length === 0) {
      throw createHttpError(400, "Post must include text or at least one image");
    }

    const post = await Post.create({
      author: req.user._id,
      text,
      imageUrl: imageUrls[0] || "",
      imageUrls,
      likes: [],
      comments: [],
      notificationsEnabled: true,
    });

    const createdPost = await Post.findById(post._id)
      .populate("author", "name avatarUrl")
      .populate("comments.author", "name avatarUrl")
      .lean();

    return res.status(201).json({ post: serializePost(createdPost) });
  } catch (error) {
    return next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const imageUrls = normalizeImageUrls(req.body);
    const post = await Post.findById(postId);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.author.toString() !== req.user._id.toString()) {
      throw createHttpError(403, "You can edit only your own posts");
    }

    if (!text && imageUrls.length === 0) {
      throw createHttpError(400, "Post must include text or at least one image");
    }

    post.text = text;
    post.imageUrl = imageUrls[0] || "";
    post.imageUrls = imageUrls;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("author", "name avatarUrl")
      .populate("comments.author", "name avatarUrl")
      .lean();

    return res.status(200).json({ post: serializePost(updatedPost) });
  } catch (error) {
    return next(error);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();
    const post = await Post.findById(postId);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    const currentIndex = post.likes.findIndex((id) => id.toString() === userId);
    const liked = currentIndex === -1;

    if (liked) {
      post.likes.push(new mongoose.Types.ObjectId(userId));
    } else {
      post.likes.splice(currentIndex, 1);
    }

    await post.save();

    const authorId = post.author.toString();
    if (liked && authorId !== userId) {
      const postAuthor = await User.findById(authorId).select(
        "expoPushTokens",
      );
      await createUserNotification({
        userId: authorId,
        type: "post_like",
        title: `${req.user?.name || "Someone"} liked your post`,
        body: post.text
          ? post.text.slice(0, 120)
          : "Someone reacted to your post.",
        data: {
          type: "post_like",
          postId: post._id.toString(),
          actorId: userId,
          actorName: req.user?.name || "",
        },
        push: {
          enabled: !post.notificationsEnabled,
          tokens: postAuthor?.expoPushTokens || [],
          channelId: "messages",
        },
      });
    }

    return res.status(200).json({
      liked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    return next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const text = String(req.body?.text || "").trim();
    const post = await Post.findById(postId);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    post.comments.push({
      author: req.user._id,
      text,
    });
    await post.save();
    await post.populate("comments.author", "name avatarUrl");

    const comment = post.comments[post.comments.length - 1];

    const authorId = post.author.toString();
    const actorId = req.user._id.toString();
    if (authorId !== actorId) {
      const postAuthor = await User.findById(authorId).select(
        "expoPushTokens",
      );
      await createUserNotification({
        userId: authorId,
        type: "post_comment",
        title: `${req.user?.name || "Someone"} commented on your post`,
        body: text.slice(0, 160) || "Someone commented on your post.",
        data: {
          type: "post_comment",
          postId: post._id.toString(),
          commentId: comment._id.toString(),
          actorId,
          actorName: req.user?.name || "",
        },
        push: {
          enabled: !post.notificationsEnabled,
          tokens: postAuthor?.expoPushTokens || [],
          channelId: "messages",
        },
      });
    }

    return res.status(201).json({ comment });
  } catch (error) {
    return next(error);
  }
};

const togglePostNotifications = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.author.toString() !== req.user._id.toString()) {
      throw createHttpError(403, "You can update only your own posts");
    }

    post.notificationsEnabled = !post.notificationsEnabled;
    await post.save();

    return res.status(200).json({
      notificationsEnabled: post.notificationsEnabled,
    });
  } catch (error) {
    return next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.author.toString() !== req.user._id.toString()) {
      throw createHttpError(403, "You can delete only your own posts");
    }

    await Post.deleteOne({ _id: postId });
    return res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    return next(error);
  }
};

const seedPosts = async (_req, res, next) => {
  try {
    // Check if posts already exist
    const existingCount = await Post.countDocuments();
    if (existingCount > 0) {
      return res
        .status(200)
        .json({ message: "Posts already seeded", count: existingCount });
    }

    // Create seed users
    const hash = await bcrypt.hash("password123", 10);
    const seedUsers = await User.insertMany([
      {
        name: "Urgoo Cinema",
        email: "urgoo@seed.com",
        passwordHash: hash,
        avatarUrl:
          "https://public.youware.com/users-website-assets/prod/a75881b7-308c-4271-80ce-76a6227bc546/c85092476493499e9c7bcf274a7868a0.jpg",
        bio: "Your daily dose of cinema 🎬",
      },
      {
        name: "Nature Collective",
        email: "nature@seed.com",
        passwordHash: hash,
        avatarUrl:
          "https://public.youware.com/users-website-assets/prod/a75881b7-308c-4271-80ce-76a6227bc546/5fb5f9df61ed4df3a886fd97ecd87794.jpg",
        bio: "Connecting you with nature 🌿",
      },
      {
        name: "Sarnai Tsetseg",
        email: "sarnai@seed.com",
        passwordHash: hash,
        avatarUrl: "https://i.pravatar.cc/150?img=13",
        bio: "Runner & dreamer 🏃‍♀️",
      },
      {
        name: "Enkhjin Bat",
        email: "enkhjin@seed.com",
        passwordHash: hash,
        avatarUrl: "https://i.pravatar.cc/150?img=15",
        bio: "Developer & creator 🖥️",
      },
    ]);

    // Create seed posts
    const posts = await Post.insertMany([
      {
        author: seedUsers[0]._id,
        text: 'Christopher Nolan\'s "The Dark Knight" inspired Timothee Chalamet to become an actor. A masterpiece that changed cinema forever. 🎬✨',
        imageUrl:
          "https://public.youware.com/users-website-assets/prod/a75881b7-308c-4271-80ce-76a6227bc546/f5d02131c15447ea9320de112b4b1f67.jpg",
        likes: [seedUsers[1]._id, seedUsers[2]._id, seedUsers[3]._id],
        comments: [
          { author: seedUsers[1]._id, text: "Absolutely iconic film!" },
          { author: seedUsers[2]._id, text: "Heath Ledger was legendary 🃏" },
        ],
      },
      {
        author: seedUsers[1]._id,
        text: "Silence speaks when words can't. The winter solitude is magical. ❄️🏔️",
        imageUrl:
          "https://public.youware.com/users-website-assets/prod/a75881b7-308c-4271-80ce-76a6227bc546/5fb5f9df61ed4df3a886fd97ecd87794.jpg",
        likes: [seedUsers[0]._id, seedUsers[3]._id],
        comments: [{ author: seedUsers[3]._id, text: "This is breathtaking!" }],
      },
      {
        author: seedUsers[2]._id,
        text: "Just finished my first marathon! 🏃‍♀️ So proud of this achievement! Never give up on your dreams 💪",
        imageUrl: "",
        likes: [seedUsers[0]._id, seedUsers[1]._id, seedUsers[3]._id],
        comments: [
          { author: seedUsers[0]._id, text: "Congratulations!! 🎉" },
          { author: seedUsers[1]._id, text: "You're an inspiration!" },
          { author: seedUsers[3]._id, text: "Amazing work! 💪" },
        ],
      },
      {
        author: seedUsers[3]._id,
        text: "New workspace, new energy! 🖥️✨ Working from home has never felt this good.",
        imageUrl: "https://picsum.photos/800/500?random=6",
        likes: [seedUsers[2]._id],
        comments: [{ author: seedUsers[2]._id, text: "Love the setup!" }],
      },
    ]);

    return res
      .status(201)
      .json({ message: "Seeded successfully", count: posts.length });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  toggleLike,
  addComment,
  togglePostNotifications,
  deletePost,
  seedPosts,
};
