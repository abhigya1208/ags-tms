const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// Casing fix for Linux/Render
let chatController;
try {
  chatController = require("../controllers/chatcontroller");
} catch (err) {
  chatController = require("../controllers/chatcontroller");
}

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
} = chatController;

// Auth middleware applied to all chat routes
router.use(authenticate);

router.get("/", getMyChats);
router.get("/users", getAllUsers);
router.post("/", createOrGetChat);
router.post("/group", createGroupChat);
router.put("/group/:chatId/add", addMember);
router.delete("/group/:chatId/remove/:userId", removeMember);
router.delete("/group/:chatId", deleteGroup);

// Message routes
router.get("/:chatId/messages", getMessages);
router.post("/message", sendMessage); // Targeted by ChatWindow

module.exports = router;