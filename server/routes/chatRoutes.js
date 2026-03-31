const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getMyChats,
  getAllUsers,
  createOrGetChat,
  createGroupChat,
  addMember,
  removeMember,
  deleteGroup,
  getMessages
} = require("../controllers/chatcontroller");

// All routes are protected
router.use(protect);

// Chat routes
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