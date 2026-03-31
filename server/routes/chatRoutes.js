const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getChats,
  getMessages,
  sendMessage,
  createGroup
} = require("../controllers/chatcontroller");  // ✅ Capital C

// All routes are protected
router.use(protect);

// Chat routes
router.get("/", getChats);
router.get("/:chatId/messages", getMessages);
router.post("/message", sendMessage);
router.post("/group", createGroup);

module.exports = router;