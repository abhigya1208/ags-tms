const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getMyChats,
  getAllUsers,
  createOrGetChat,
  createGroupChat,
  addMember,
  removeMember,
  deleteGroup,
  getMessages,
  sendMessage
} = require("../controllers/chatcontroller");

// Check if functions exist (for debugging)
console.log("Chat controller functions loaded:", {
  getMyChats: typeof getMyChats,
  getAllUsers: typeof getAllUsers,
  createOrGetChat: typeof createOrGetChat,
  createGroupChat: typeof createGroupChat,
  addMember: typeof addMember,
  removeMember: typeof removeMember,
  deleteGroup: typeof deleteGroup,
  getMessages: typeof getMessages,
  sendMessage: typeof sendMessage
});

// Check if protect middleware exists
console.log("Protect middleware type:", typeof protect);

// All routes are protected
if (typeof protect === 'function') {
  router.use(protect);
} else {
  console.error("Protect middleware is not a function!");
}

// Chat routes
if (typeof getMyChats === 'function') router.get("/", getMyChats);
if (typeof getAllUsers === 'function') router.get("/users", getAllUsers);
if (typeof createOrGetChat === 'function') router.post("/", createOrGetChat);
if (typeof createGroupChat === 'function') router.post("/group", createGroupChat);
if (typeof addMember === 'function') router.put("/group/:chatId/add", addMember);
if (typeof removeMember === 'function') router.delete("/group/:chatId/remove/:userId", removeMember);
if (typeof deleteGroup === 'function') router.delete("/group/:chatId", deleteGroup);
if (typeof getMessages === 'function') router.get("/:chatId/messages", getMessages);
if (typeof sendMessage === 'function') router.post("/message", sendMessage);

module.exports = router;