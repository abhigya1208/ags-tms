const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const Chat = require("../models/chat");

// Maps userId -> socketId for online tracking
const onlineUsers = new Map();

const initChatSocket = (io) => {
  // ─── JWT Authentication for Socket ────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { _id, name, role }
      next();
    } catch (err) {
      return next(new Error("Authentication error: Token invalid"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

    // ─── Mark user online ──────────────────────────────────────────────────
    onlineUsers.set(userId, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));

    // ─── Join all chat rooms this user belongs to ──────────────────────────
    socket.on("join_my_rooms", async () => {
      try {
        const chats = await Chat.find({ members: userId }, "_id");
        chats.forEach((chat) => {
          socket.join(chat._id.toString());
        });
      } catch (err) {
        console.error("[Socket] join_my_rooms error:", err);
      }
    });

    // ─── Join a specific room (when user opens a chat) ─────────────────────
    socket.on("join_room", (chatId) => {
      socket.join(chatId);
    });

    // ─── Send message ──────────────────────────────────────────────────────
    socket.on("send_message", async ({ chatId, text }) => {
      try {
        if (!chatId || !text?.trim()) return;

        // Verify sender is member of this chat
        const chat = await Chat.findOne({ _id: chatId, members: userId });
        if (!chat) return;

        const message = await Message.create({
          chatId,
          senderId: userId,
          text: text.trim(),
          seenBy: [userId], // sender has seen it
        });

        // Update lastMessage on chat
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        const populated = await Message.findById(message._id).populate(
          "senderId",
          "name role"
        );

        // Emit to everyone in the room
        io.to(chatId).emit("receive_message", populated);

        // Emit notification to members who are online but not in this room
        chat.members.forEach((memberId) => {
          const mId = memberId.toString();
          if (mId !== userId) {
            const memberSocketId = onlineUsers.get(mId);
            if (memberSocketId) {
              io.to(memberSocketId).emit("new_notification", {
                chatId,
                senderName: socket.user.name,
                text: text.trim(),
                isGroup: chat.isGroup,
                groupName: chat.groupName,
              });
            }
          }
        });
      } catch (err) {
        console.error("[Socket] send_message error:", err);
      }
    });

    // ─── Typing indicator ──────────────────────────────────────────────────
    socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("typing", {
        chatId,
        userId,
        name: socket.user.name,
      });
    });

    socket.on("stop_typing", ({ chatId }) => {
      socket.to(chatId).emit("stop_typing", { chatId, userId });
    });

    // ─── Mark messages as seen ─────────────────────────────────────────────
    socket.on("mark_seen", async ({ chatId }) => {
      try {
        // Mark all unseen messages in this chat as seen by this user
        await Message.updateMany(
          { chatId, seenBy: { $ne: userId } },
          { $addToSet: { seenBy: userId } }
        );

        // Notify others in the room
        socket.to(chatId).emit("seen_update", { chatId, userId });
      } catch (err) {
        console.error("[Socket] mark_seen error:", err);
      }
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log(`[Socket] User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { initChatSocket };
