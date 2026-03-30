const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyChats,
  getAllUsers,
  createOrGetChat,
  createGroupChat,
  addMember,
  removeMember,
  deleteGroup,
  getMessages,
} = require("../controllers/chatController");

// All routes protected by JWT middleware
router.use(protect);

router.get("/", getMyChats);                          // GET  /api/chat
router.get("/users", getAllUsers);                    // GET  /api/chat/users
router.post("/", createOrGetChat);                   // POST /api/chat  (1-to-1)
router.post("/group", createGroupChat);              // POST /api/chat/group
router.get("/:chatId/messages", getMessages);        // GET  /api/chat/:chatId/messages
router.post("/:chatId/members", addMember);          // POST /api/chat/:chatId/members
router.delete("/:chatId/members/:userId", removeMember); // DELETE /api/chat/:chatId/members/:userId
router.delete("/:chatId", deleteGroup);              // DELETE /api/chat/:chatId

module.exports = router;
