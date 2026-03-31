const express = require("express");
const router = express.Router();

// FIX: 'protect' ki jagah 'authenticate' use kiya jo aapki auth.js mein defined hai
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

// Sabhi routes ko protect karne ke liye middleware use karein
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