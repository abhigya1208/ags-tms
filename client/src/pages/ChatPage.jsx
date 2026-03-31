import React, { useState, useEffect, useCallback } from "react";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import { getSocket } from "../socket/socket";
import "../components/chat/Chat.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]); // { chatId, senderName, text }
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ─── Fetch all chats ───────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/chat`, { headers: authHeaders });
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("fetchChats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchChats();
    const socket = getSocket();

    socket.on("online_users", (users) => setOnlineUsers(users));

    socket.on("receive_message", (message) => {
      // Update lastMessage in chat list
      setChats((prev) =>
        prev.map((c) =>
          c._id === message.chatId
            ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() }
            : c
        )
      );
    });

    socket.on("new_notification", (notif) => {
      // Only show notification if this chat is not currently selected
      setSelectedChat((sel) => {
        if (!sel || sel._id !== notif.chatId) {
          setNotifications((prev) => [
            { ...notif, id: Date.now() },
            ...prev.slice(0, 4),
          ]);
          // Auto-dismiss after 4 seconds
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.chatId !== notif.chatId));
          }, 4000);
        }
        return sel;
      });
    });

    return () => {
      socket.off("online_users");
      socket.off("receive_message");
      socket.off("new_notification");
    };
  }, [fetchChats]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    // Remove notification for this chat
    setNotifications((prev) => prev.filter((n) => n.chatId !== chat._id));
  };

  const handleNewChat = (chat) => {
    setChats((prev) => {
      const exists = prev.find((c) => c._id === chat._id);
      if (exists) return prev;
      return [chat, ...prev];
    });
    setSelectedChat(chat);
  };

  return (
    <div className="chat-page">
      {/* ── Popup Notifications ── */}
      <div className="notification-stack">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="notif-popup"
            onClick={() => {
              const chat = chats.find((c) => c._id === n.chatId);
              if (chat) handleSelectChat(chat);
            }}
          >
            <div className="notif-avatar">
              {n.senderName?.charAt(0).toUpperCase()}
            </div>
            <div className="notif-body">
              <p className="notif-name">
                {n.senderName}
                {n.isGroup && n.groupName && (
                  <span className="notif-group"> › {n.groupName}</span>
                )}
              </p>
              <p className="notif-text">{n.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="chat-layout">
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onChatsUpdate={setChats}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          authHeaders={authHeaders}
          loading={loading}
        />

        <ChatWindow
          chat={selectedChat}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          authHeaders={authHeaders}
          onChatUpdate={(updatedChat) => {
            setChats((prev) =>
              prev.map((c) => (c._id === updatedChat._id ? updatedChat : c))
            );
            setSelectedChat(updatedChat);
          }}
          onGroupDeleted={(chatId) => {
            setChats((prev) => prev.filter((c) => c._id !== chatId));
            setSelectedChat(null);
          }}
        />
      </div>
    </div>
  );
};

export default ChatPage;
