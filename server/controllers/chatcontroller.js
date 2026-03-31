const Chat = require("../models/Chat");
const Message = require("../models/message");
const mongoose = require("mongoose");

// ─── Get all chats for logged-in user ───────────────────────────────────────
const getMyChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ members: userId })
      .populate("members", "name role")
      .populate("admin", "name role")
      .populate({
        path: "lastMessage",
        populate: { path: "senderId", select: "name" },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error("getMyChats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Get all users (to start a new chat) ────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    // Use the existing User model from your project
    const User = mongoose.model("User");
    const users = await User.find(
      { _id: { $ne: req.user._id } },
      "name email role"
    );
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Create or fetch 1-to-1 chat ────────────────────────────────────────────
const createOrGetChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    // Check if chat already exists between these two users
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [userId, targetUserId], $size: 2 },
    })
      .populate("members", "name role")
      .populate({ path: "lastMessage", populate: { path: "senderId", select: "name" } });

    if (chat) return res.json(chat);

    // Create new 1-to-1 chat
    const newChat = await Chat.create({
      isGroup: false,
      members: [userId, targetUserId],
      createdBy: userId,
    });

    const populated = await Chat.findById(newChat._id).populate(
      "members",
      "name role"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error("createOrGetChat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Create group chat ───────────────────────────────────────────────────────
const createGroupChat = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const userId = req.user._id;

    if (!groupName || !members || members.length < 2) {
      return res.status(400).json({
        message: "Group name and at least 2 other members are required",
      });
    }

    // Include creator in members
    const allMembers = [...new Set([...members, userId.toString()])];

    if (allMembers.length > 15) {
      return res.status(400).json({ message: "Group cannot exceed 15 members" });
    }

    // If system admin is in the group, they become admin; else creator is admin
    const User = mongoose.model("User");
    const adminUser = await User.findOne({
      _id: { $in: allMembers },
      role: "admin",
    });

    const groupAdmin = adminUser ? adminUser._id : userId;

    const group = await Chat.create({
      isGroup: true,
      groupName: groupName.trim(),
      members: allMembers,
      admin: groupAdmin,
      createdBy: userId,
    });

    const populated = await Chat.findById(group._id)
      .populate("members", "name role")
      .populate("admin", "name role");

    res.status(201).json(populated);
  } catch (err) {
    console.error("createGroupChat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Add member to group (anyone can add) ───────────────────────────────────
const addMember = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: newMemberId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.members.includes(newMemberId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    if (chat.members.length >= 15) {
      return res.status(400).json({ message: "Group is full (max 15 members)" });
    }

    chat.members.push(newMemberId);
    await chat.save();

    const updated = await Chat.findById(chatId)
      .populate("members", "name role")
      .populate("admin", "name role");

    res.json(updated);
  } catch (err) {
    console.error("addMember error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Remove member (only admin) ──────────────────────────────────────────────
const removeMember = async (req, res) => {
  try {
    const { chatId, userId: targetId } = req.params;
    const requesterId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    chat.members = chat.members.filter((m) => m.toString() !== targetId);
    await chat.save();

    const updated = await Chat.findById(chatId)
      .populate("members", "name role")
      .populate("admin", "name role");

    res.json(updated);
  } catch (err) {
    console.error("removeMember error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Delete group (only admin) ───────────────────────────────────────────────
const deleteGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const requesterId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: "Only admin can delete the group" });
    }

    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("deleteGroup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Fetch messages for a chat (paginated) ──────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 40;
    const skip = (page - 1) * limit;

    // Make sure user is a member
    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user._id,
    });
    if (!chat) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ chatId })
      .populate("senderId", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return in ascending order for display
    res.json(messages.reverse());
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMyChats,
  getAllUsers,
  createOrGetChat,
  createGroupChat,
  addMember,
  removeMember,
  deleteGroup,
  getMessages,
};
