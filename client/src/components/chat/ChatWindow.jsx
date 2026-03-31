import React, { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { getSocket } from "../../socket/socket";

// Clean up the API URL to avoid double /api/api
const getBaseUrl = () => {
  let url = process.env.REACT_APP_API_URL || "http://localhost:5000";
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }
  return url;
};

const API = getBaseUrl();

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

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const chatIdRef = useRef(null);
  const socket = getSocket();

  const fetchMessages = useCallback(
    async (chatId, pageNum = 1) => {
      try {
        const res = await fetch(
          `${API}/api/chat/${chatId}/messages?page=${pageNum}`,
          { headers: authHeaders }
        );
        
        if (!res.ok) return;
        
        const data = await res.json();
        const msgArray = Array.isArray(data) ? data : [];
        
        setHasMore(msgArray.length >= 20);

        if (pageNum === 1) setMessages(msgArray);
        else setMessages((prev) => [...msgArray, ...prev]);
      } catch (err) {
        console.error("fetchMessages error:", err);
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    if (!chat?._id) return;
    chatIdRef.current = chat._id;
    setMessages([]);
    setPage(1);
    setHasMore(true);

    if (socket) {
      socket.emit("joinChat", chat._id);
      fetchMessages(chat._id, 1);
    }
  }, [chat?._id, socket, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    const onReceive = (msg) => {
      if (msg.chatId === chatIdRef.current) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };
    socket.on("newMessage", onReceive);
    return () => socket.off("newMessage", onReceive);
  }, [socket]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chat) return;

    try {
      const res = await fetch(`${API}/api/chat/message`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chatId: chat._id, 
          content: trimmed,
          text: trimmed // sending both to ensure compatibility
        }),
      });
      
      if (res.ok) {
        const newMessage = await res.json();
        // Option: manually add to UI if socket is slow
        // setMessages(prev => [...prev, newMessage]);
        setText("");
      } else {
        console.error("Message failed with status:", res.status);
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

  if (!chat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state"><h3>Select a conversation</h3></div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="avatar md">{chat.groupName?.charAt(0) || "U"}</div>
          <h3 className="chat-header-name">{chat.groupName || "Chat"}</h3>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg._id || idx}
            message={msg}
            isOwn={msg.senderId?._id === currentUser._id || msg.senderId === currentUser._id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-row">
          <textarea
            className="message-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
          />
          <button className="send-btn" onClick={handleSend} disabled={!text.trim()}>➤</button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;