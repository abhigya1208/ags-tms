import React, { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { getSocket } from "../../socket/socket";
import api from "../../services/api";

const ChatWindow = ({ chat, currentUser, authHeaders, onChatUpdate, onGroupDeleted }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const chatIdRef = useRef(null);
  const socket = getSocket();

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const res = await api.get(`/chat/${chatId}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchMessages error:", err);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!chat?._id) return;
    chatIdRef.current = chat._id;
    setMessages([]);
    if (socket && socket.connected) {
      socket.emit("joinChat", chat._id);
      fetchMessages(chat._id);
    }
  }, [chat?._id, socket, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    
    const onReceiveMessage = (msg) => {
      if (msg.chatId === chatIdRef.current) {
        // ✅ FIX: Check if message already exists before adding
        setMessages((prev) => {
          // Don't add if message already exists (by _id)
          const exists = prev.some(m => m._id === msg._id);
          if (exists) return prev;
          
          // Don't add if it's our own temp message that's waiting for replacement
          const isOwnTemp = prev.some(m => m.isTemp && m.content === msg.text && m.senderId?._id === currentUser._id);
          if (isOwnTemp) return prev;
          
          return [...prev, msg];
        });
        
        // Update last message in chat list
        if (onChatUpdate) {
          onChatUpdate({
            ...chat,
            lastMessage: msg,
            updatedAt: new Date().toISOString()
          });
        }
      }
    };

    const onMessagesRead = ({ chatId }) => {
      if (chatId === chatIdRef.current) {
        setMessages((prev) => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    socket.on("newMessage", onReceiveMessage);
    socket.on("messagesRead", onMessagesRead);

    return () => {
      socket.off("newMessage", onReceiveMessage);
      socket.off("messagesRead", onMessagesRead);
    };
  }, [socket, chat, onChatUpdate, currentUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chat || sending) return;
    
    setSending(true);
    const tempId = Date.now();
    const tempMessage = {
      _id: tempId,
      chatId: chat._id,
      text: trimmed,
      senderId: currentUser,
      createdAt: new Date().toISOString(),
      isTemp: true
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setText("");

    try {
      const res = await api.post("/chat/message", { 
        chatId: chat._id, 
        content: trimmed 
      });
      
      if (res.data) {
        // Replace temp message with real one
        setMessages((prev) => prev.map(m => m._id === tempId ? { ...res.data, text: res.data.text || res.data.content } : m));
        
        // Emit via socket for real-time (broadcast only, not to self)
        if (socket && socket.connected) {
          socket.emit("sendMessage", {
            chatId: chat._id,
            content: trimmed,
            senderId: currentUser._id,
            senderName: currentUser.name
          });
        }
      }
    } catch (err) {
      console.error("Send error:", err);
      // Remove temp message on error
      setMessages((prev) => prev.filter(m => m._id !== tempId));
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h3>Welcome to AGS Chat</h3>
          <p>Select a chat from the sidebar or start a new conversation</p>
        </div>
      </div>
    );
  }

  const chatName = chat.isGroup ? chat.groupName : chat.members?.find(m => m._id !== currentUser._id)?.name || "Unknown User";
  const chatRole = chat.isGroup ? `Group • ${chat.members?.length || 0} members` : "1-on-1 Chat";

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{chatName}</h3>
          <p>{chatRole}</p>
        </div>
        {chat.isGroup && chat.admin?._id === currentUser._id && (
          <button className="group-settings-btn" onClick={() => {}}>
            ⚙️ Manage Group
          </button>
        )}
      </div>
      
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble 
              key={msg._id || idx} 
              message={msg} 
              isOwn={msg.senderId?._id === currentUser._id || msg.senderId === currentUser._id}
              isTemp={msg.isTemp}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className="input-area">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          rows={1}
        />
        <button onClick={handleSend} disabled={!text.trim() || sending}>
          {sending ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;