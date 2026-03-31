const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const chatController = require("../controllers/chatcontroller");

// Destructure with safety check
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

// Debug log
console.log("✅ Chat routes loaded, sendMessage exists:", typeof sendMessage === "function");

router.use(authenticate);

router.get("/", getMyChats);
router.get("/users", getAllUsers);
router.post("/", createOrGetChat);
router.post("/group", createGroupChat);
router.put("/group/:chatId/add", addMember);
router.delete("/group/:chatId/remove/:userId", removeMember);
router.delete("/group/:chatId", deleteGroup);
router.get("/:chatId/messages", getMessages);
router.post("/message", sendMessage);

module.exports = router;