import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import api from "../services/api";
import { getSocket } from "../socket/socket";
import "../components/chat/Chat.css";

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("ags_user") || "{}");
  const token = localStorage.getItem("ags_token");

  // useMemo use kar rahe hain taaki dependency stable rahe
  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // ─── Fetch all chats ───────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      // FIX: Headers pass kiye hain aur path ko clean rakha hai
      const res = await api.get('/chat', { headers: authHeaders });
      setChats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchChats error:", err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  // ─── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchChats();
    const socket = getSocket();

    if (socket) {
      socket.on("online_users", (users) => setOnlineUsers(users));

      socket.on("receive_message", (message) => {
        setChats((prev) =>
          prev.map((c) =>
            c._id === message.chatId
              ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() }
              : c
          )
        );
      });

      socket.on("new_notification", (notif) => {
        setSelectedChat((sel) => {
          if (!sel || sel._id !== notif.chatId) {
            setNotifications((prev) => [
              { ...notif, id: Date.now() },
              ...prev.slice(0, 4),
            ]);
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.chatId !== notif.chatId));
            }, 4000);
          }
          return sel;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("online_users");
        socket.off("receive_message");
        socket.off("new_notification");
      }
    };
  }, [fetchChats]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
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

      <div className="chat-layout">
        {/* ChatList component ko yahan props pass ho rahe hain */}
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