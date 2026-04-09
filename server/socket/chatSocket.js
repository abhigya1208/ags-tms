const Message = require("../models/message");
const Chat = require("../models/chat");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ New user connected:", socket.id);

    // 1. Join a specific chat room
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`👤 User joined room: ${chatId}`);
    });

    // 2. Leave chat room
    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log(`👤 User left room: ${chatId}`);
    });

    // 3. Typing indicators
    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing", chatId);
    });
    
    socket.on("stopTyping", (chatId) => {
      socket.to(chatId).emit("stopTyping", chatId);
    });

    // 4. Send Message - Save to DB and broadcast to OTHERS only
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, content, senderId, senderName } = data;
        
        if (!chatId || !content) {
          console.log("Missing chatId or content");
          return;
        }

        // Save message to database
        const message = await Message.create({
          chatId,
          senderId,
          text: content,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name role");

        // Update chat's lastMessage
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        // Broadcast to OTHERS only (not to sender)
        socket.broadcast.to(chatId).emit("newMessage", populatedMessage);
        
        console.log(`📨 Message sent to room ${chatId}: ${content}`);
      } catch (error) {
        console.error("Send message error:", error);
      }
    });

    // 5. Disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });
};