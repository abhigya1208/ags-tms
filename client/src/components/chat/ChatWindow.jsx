import React, { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { getSocket } from "../../socket/socket";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
// Double /api fix
const API = API_BASE.endsWith('/api') ? API_BASE.replace('/api', '') : API_BASE;

const ChatWindow = ({
  chat,
  currentUser,
  onlineUsers,
  authHeaders,
  onChatUpdate,
  onGroupDeleted,
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const chatIdRef = useRef(null);

  const socket = getSocket();

  // ─── Fetch messages ──────────────────────────────────────────────────────
  const fetchMessages = useCallback(
    async (chatId, pageNum = 1) => {
      try {
        // FIX: Removed extra /api from path
        const res = await fetch(
          `${API}/api/chat/${chatId}/messages?page=${pageNum}`,
          { headers: authHeaders }
        );
        
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        const msgArray = Array.isArray(data) ? data : [];
        
        if (msgArray.length < 40) setHasMore(false);
        else setHasMore(true);

        if (pageNum === 1) setMessages(msgArray);
        else setMessages((prev) => [...msgArray, ...prev]);
      } catch (err) {
        console.error("fetchMessages error:", err);
      }
    },
    [authHeaders]
  );

  // ─── When chat changes ────────────────────────────────────────────────────
  useEffect(() => {
    if (!chat || !chat._id) return;
    chatIdRef.current = chat._id;
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setTypingUsers([]);
    setShowMembers(false);

    if (socket) {
      socket.emit("joinChat", chat._id); // Changed to joinChat as per backend
      fetchMessages(chat._id, 1);
    }
  }, [chat?._id, socket, fetchMessages]);

  // ─── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = (message) => {
      if (message.chatId !== chatIdRef.current) return;
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    const onTyping = (chatId) => {
      if (chatId !== chatIdRef.current) return;
      // You can add logic here to show who is typing if backend sends user info
    };

    socket.on("newMessage", onReceive); // Backend uses 'newMessage'
    socket.on("typing", onTyping);

    return () => {
      socket.off("newMessage", onReceive);
      socket.off("typing", onTyping);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chat) return;

    try {
      const res = await fetch(`${API}/api/chat/message`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chat._id, content: trimmed }),
      });
      
      if (res.ok) {
        const newMessage = await res.json();
        // Socket handle kar lega update, ya manually add karein:
        // setMessages(prev => [...prev, newMessage]);
        setText("");
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socket) socket.emit("typing", chat._id);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchMessages(chat._id, nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const getChatName = () => {
    if (!chat) return "";
    if (chat.isGroup) return chat.groupName;
    const other = chat.members?.find((m) => m._id !== currentUser._id);
    return other?.name || "Unknown";
  };

  if (!chat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a chat from the left or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="avatar md">{getChatName().charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="chat-header-name">{getChatName()}</h3>
            <p className="chat-header-sub">
              {chat.isGroup ? `${chat.members?.length} members` : (onlineUsers.includes(chat.members?.find(m => m._id !== currentUser._id)?._id) ? "● Online" : "● Offline")}
            </p>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {hasMore && (
          <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load older messages"}
          </button>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg._id || idx}
            message={msg}
            isOwn={msg.senderId?._id === currentUser._id || msg.senderId === currentUser._id}
            showSender={chat.isGroup}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-row">
          <textarea
            className="message-input"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="send-btn" onClick={handleSend} disabled={!text.trim()}>➤</button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;