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

    // 2. Typing indicators (Optional but good for UX)
    socket.on("typing", (chatId) => socket.in(chatId).emit("typing", chatId));
    socket.on("stopTyping", (chatId) => socket.in(chatId).emit("stopTyping", chatId));

    // 3. New Message Handling
    socket.on("newMessage", (newMessageReceived) => {
      const chat = newMessageReceived.chatId;

      if (!chat) return console.log("Chat ID not defined");

      // Broadcast the message to everyone in the room EXCEPT the sender
      // Note: Sender usually gets the response via API, but socket handles the others
      socket.in(chat).emit("messageReceived", newMessageReceived);
    });

    // 4. Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });
};