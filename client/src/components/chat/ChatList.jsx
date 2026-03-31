import React, { useState, useEffect } from "react";
import GroupModal from "./GroupModal";

// Render par process.env ka path check karne ke liye ye safe check:
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
// Agar API URL ke end mein '/api' hai toh use clean kar dete hain double path se bachne ke liye
const API = API_BASE.endsWith('/api') ? API_BASE.replace('/api', '') : API_BASE;

const ChatList = ({
  chats,
  selectedChat,
  onSelectChat,
  onNewChat,
  onChatsUpdate,
  currentUser,
  onlineUsers,
  authHeaders,
  loading,
}) => {
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (showUserList) fetchUsers();
  }, [showUserList]);

  const fetchUsers = async () => {
    try {
      // FIX: Yahan standard path use kar rahe hain
      const res = await fetch(`${API}/api/chat/users`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchUsers error:", err);
    }
  };

  const startDirectChat = async (targetUserId) => {
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) throw new Error("Failed to start chat");
      const chat = await res.json();
      onNewChat(chat);
      setShowUserList(false);
    } catch (err) {
      console.error("startDirectChat error:", err);
    }
  };

  const getChatName = (chat) => {
    if (!chat) return "Unknown";
    if (chat.isGroup) return chat.groupName;
    const other = chat.members?.find((m) => m._id !== currentUser._id);
    return other?.name || "Unknown User";
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(w => w)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const isOnline = (chat) => {
    if (!chat || chat.isGroup) return false;
    const other = chat.members?.find((m) => m._id !== currentUser._id);
    return other && onlineUsers.includes(other._id);
  };

  const getLastMessageText = (chat) => {
    const lm = chat.lastMessage;
    if (!lm) return "No messages yet";
    const senderName =
      lm.senderId?._id === currentUser._id ? "You" : (lm.senderId?.name || "User");
    return `${senderName}: ${lm.content || lm.text || "Message"}`;
  };

  const filteredChats = chats.filter((c) =>
    getChatName(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-list">
      {/* Header */}
      <div className="chat-list-header">
        <h2 className="chat-list-title">Messages</h2>
        <div className="chat-list-actions">
          <button
            className="icon-btn"
            title="New Direct Message"
            onClick={() => setShowUserList((v) => !v)}
          >
            ✏️
          </button>
          <button
            className="icon-btn"
            title="New Group"
            onClick={() => setShowGroupModal(true)}
          >
            👥
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* New Direct Chat — User Picker */}
      {showUserList && (
        <div className="user-picker">
          <p className="user-picker-label">Start a conversation</p>
          {users.length === 0 ? <p className="chat-list-empty">No users found</p> : 
           users.map((u) => (
            <div
              key={u._id}
              className="user-picker-item"
              onClick={() => startDirectChat(u._id)}
            >
              <div className="avatar sm">{getInitials(u.name)}</div>
              <div className="user-info">
                <p className="user-name">{u.name}</p>
                <p className="user-role">{u.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Items */}
      <div className="chat-items">
        {loading ? (
          <p className="chat-list-empty">Loading chats...</p>
        ) : filteredChats.length === 0 ? (
          <p className="chat-list-empty">No chats yet. Start one! ✏️</p>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? "active" : ""}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="avatar-wrap">
                <div className="avatar">{getInitials(getChatName(chat))}</div>
                {isOnline(chat) && <span className="online-dot" />}
              </div>
              <div className="chat-item-body">
                <div className="chat-item-top">
                  <span className="chat-item-name">{getChatName(chat)}</span>
                  {chat.isGroup && <span className="group-badge">Group</span>}
                </div>
                <p className="chat-item-last">{getLastMessageText(chat)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <GroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(group) => {
            onNewChat(group);
            setShowGroupModal(false);
          }}
          authHeaders={authHeaders}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ChatList;