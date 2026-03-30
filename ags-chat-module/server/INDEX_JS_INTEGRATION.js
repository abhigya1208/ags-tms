// ============================================================
// FILE: server/index.js  (YOUR EXISTING FILE)
// ADD the lines marked with ✅ — do not touch anything else
// ============================================================

// ✅ 1. Replace:  const app = express();
//    With these three lines:
const express = require("express");
const http = require("http");                          // ✅ ADD
const { Server } = require("socket.io");              // ✅ ADD

const app = express();
const server = http.createServer(app);                // ✅ ADD
const io = new Server(server, {                       // ✅ ADD
  cors: {                                             // ✅ ADD
    origin: process.env.CLIENT_URL || "http://localhost:3000",  // ✅ ADD
    methods: ["GET", "POST"],                         // ✅ ADD
  },                                                  // ✅ ADD
});                                                   // ✅ ADD

// ✅ 2. Import chat module files (add near top with other requires)
const chatRoutes = require("./routes/chatRoutes");    // ✅ ADD
const { initChatSocket } = require("./socket/chatSocket"); // ✅ ADD

// ✅ 3. Register chat API routes (add with other app.use routes)
app.use("/api/chat", chatRoutes);                     // ✅ ADD

// ✅ 4. Initialize Socket.IO (add after route registrations)
initChatSocket(io);                                   // ✅ ADD

// ✅ 5. IMPORTANT — Replace: app.listen(PORT, ...)
//    With:
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {                           // ✅ CHANGE app.listen → server.listen
  console.log(`Server running on port ${PORT}`);
});

// ============================================================
// SUMMARY OF CHANGES:
// - Import http and socket.io
// - Wrap express app in http.createServer()
// - Initialize Socket.IO on the http server
// - Register /api/chat routes
// - Call initChatSocket(io)
// - Change app.listen() to server.listen()
// ============================================================
