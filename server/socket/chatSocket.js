const Message = require("../models/message");
const Chat = require("../models/chat");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat: ${chatId}`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, content, senderId } = data;
        
        const message = await Message.create({
          chatId,
          senderId,
          content,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name role");

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        io.to(chatId).emit("newMessage", populatedMessage);
      } catch (error) {
        console.error("Send message error:", error);
      }
    });

    socket.on("typing", ({ chatId, userId, userName }) => {
      socket.to(chatId).emit("userTyping", { userId, userName });
    });

    socket.on("stopTyping", ({ chatId, userId }) => {
      socket.to(chatId).emit("userStoppedTyping", { userId });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};