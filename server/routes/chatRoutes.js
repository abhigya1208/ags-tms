const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// Render/Linux fix: Check if your file is 'chatController' or 'chatcontroller'
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

// Debug log to confirm everything is loaded in Render logs
console.log("✅ Chat functions check:", {
  getMyChats: typeof getMyChats,
  sendMessage: typeof sendMessage
});

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