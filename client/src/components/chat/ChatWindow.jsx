import React, { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { getSocket } from "../../socket/socket";

const getBaseUrl = () => {
  let url = process.env.REACT_APP_API_URL || "http://localhost:5000";
  return url.endsWith('/api') ? url.slice(0, -4) : url;
};
const API = getBaseUrl();

const ChatWindow = ({ chat, currentUser, authHeaders }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const chatIdRef = useRef(null);
  const socket = getSocket();

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const res = await fetch(`${API}/api/chat/${chatId}/messages`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error("fetchMessages error:", err); }
  }, [authHeaders]);

  useEffect(() => {
    if (!chat?._id) return;
    chatIdRef.current = chat._id;
    setMessages([]);
    if (socket) {
      socket.emit("joinChat", chat._id); // Backend standard
      fetchMessages(chat._id);
    }
  }, [chat?._id, socket, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    const onReceive = (msg) => {
      if (msg.chatId === chatIdRef.current) setMessages((p) => [...p, msg]);
    };
    socket.on("newMessage", onReceive);
    return () => socket.off("newMessage");
  }, [socket]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chat) return;
    try {
      const res = await fetch(`${API}/api/chat/message`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chat._id, content: trimmed }), // Matches backend
      });
      if (res.ok) setText("");
      else console.error("Send failed:", await res.json());
    } catch (err) { console.error("Send error:", err); }
  };

  if (!chat) return <div className="chat-window empty"><h3>Select a chat</h3></div>;

  return (
    <div className="chat-window">
      <div className="chat-header"><h3>{chat.groupName || "Chat"}</h3></div>
      <div className="messages-area">
        {messages.map((m, i) => (
          <MessageBubble key={m._id || i} message={m} isOwn={m.senderId?._id === currentUser._id || m.senderId === currentUser._id} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="input-area">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Type a message..." />
        <button onClick={handleSend} disabled={!text.trim()}>➤</button>
      </div>
    </div>
  );
};

export default ChatWindow;