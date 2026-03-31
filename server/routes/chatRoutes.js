const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
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

// Sabhi routes ko protect karne ke liye
router.use(authenticate);

// Chat Routes
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