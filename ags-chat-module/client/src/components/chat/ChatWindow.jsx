import React, { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { getSocket } from "../../socket/socket";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
  const [users, setUsers] = useState([]);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const chatIdRef = useRef(null);

  const socket = getSocket();

  // ─── Fetch messages ──────────────────────────────────────────────────────
  const fetchMessages = useCallback(
    async (chatId, pageNum = 1) => {
      try {
        const res = await fetch(
          `${API}/api/chat/${chatId}/messages?page=${pageNum}`,
          { headers: authHeaders }
        );
        const data = await res.json();
        if (data.length < 40) setHasMore(false);
        else setHasMore(true);

        if (pageNum === 1) setMessages(data);
        else setMessages((prev) => [...data, ...prev]);
      } catch (err) {
        console.error("fetchMessages error:", err);
      }
    },
    [authHeaders]
  );

  // ─── When chat changes ────────────────────────────────────────────────────
  useEffect(() => {
    if (!chat) return;
    chatIdRef.current = chat._id;
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setTypingUsers([]);
    setShowMembers(false);

    socket.emit("join_room", chat._id);
    socket.emit("mark_seen", { chatId: chat._id });
    fetchMessages(chat._id, 1);
  }, [chat?._id]);

  // ─── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const onReceive = (message) => {
      if (message.chatId !== chatIdRef.current) return;
      setMessages((prev) => [...prev, message]);
      socket.emit("mark_seen", { chatId: message.chatId });
      scrollToBottom();
    };

    const onTyping = ({ chatId, userId, name }) => {
      if (chatId !== chatIdRef.current) return;
      if (userId === currentUser._id) return;
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === userId)) return prev;
        return [...prev, { userId, name }];
      });
    };

    const onStopTyping = ({ chatId, userId }) => {
      if (chatId !== chatIdRef.current) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const onSeenUpdate = ({ chatId }) => {
      if (chatId !== chatIdRef.current) return;
      // Mark all messages as seen by current user locally
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          seenBy: m.seenBy?.includes(currentUser._id)
            ? m.seenBy
            : [...(m.seenBy || []), currentUser._id],
        }))
      );
    };

    socket.on("receive_message", onReceive);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);
    socket.on("seen_update", onSeenUpdate);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
      socket.off("seen_update", onSeenUpdate);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !chat) return;
    socket.emit("send_message", { chatId: chat._id, text: trimmed });
    setText("");
    socket.emit("stop_typing", { chatId: chat._id });
    clearTimeout(typingTimer.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Typing events ─────────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    socket.emit("typing", { chatId: chat._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("stop_typing", { chatId: chat._id });
    }, 2000);
  };

  // ─── Load more messages (scroll up) ───────────────────────────────────────
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchMessages(chat._id, nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getChatName = () => {
    if (!chat) return "";
    if (chat.isGroup) return chat.groupName;
    const other = chat.members?.find((m) => m._id !== currentUser._id);
    return other?.name || "Unknown";
  };

  const getOtherUser = () => {
    if (!chat || chat.isGroup) return null;
    return chat.members?.find((m) => m._id !== currentUser._id);
  };

  const otherUser = getOtherUser();
  const isOtherOnline = otherUser && onlineUsers.includes(otherUser._id);
  const isAdmin = chat?.admin?._id === currentUser._id || currentUser.role === "admin";

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await fetch(`${API}/api/chat/${chat._id}/members/${memberId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const updated = await res.json();
      onChatUpdate(updated);
    } catch (err) {
      console.error("removeMember error:", err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group? This cannot be undone.")) return;
    try {
      await fetch(`${API}/api/chat/${chat._id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      onGroupDeleted(chat._id);
    } catch (err) {
      console.error("deleteGroup error:", err);
    }
  };

  // ─── Empty state ───────────────────────────────────────────────────────────
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
      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="avatar md">
            {getChatName().charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="chat-header-name">{getChatName()}</h3>
            {chat.isGroup ? (
              <p className="chat-header-sub">
                {chat.members?.length} members
              </p>
            ) : (
              <p className={`chat-header-sub ${isOtherOnline ? "online" : ""}`}>
                {isOtherOnline ? "● Online" : "● Offline"}
              </p>
            )}
          </div>
        </div>

        <div className="chat-header-actions">
          {chat.isGroup && (
            <button
              className="icon-btn"
              title="View Members"
              onClick={() => setShowMembers((v) => !v)}
            >
              👥
            </button>
          )}
          {chat.isGroup && isAdmin && (
            <button
              className="icon-btn danger"
              title="Delete Group"
              onClick={handleDeleteGroup}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* ── Members Panel (Group) ── */}
      {showMembers && chat.isGroup && (
        <div className="members-panel">
          <p className="members-panel-title">Members ({chat.members?.length}/15)</p>
          {chat.members?.map((m) => (
            <div key={m._id} className="member-item">
              <div className="avatar sm">{m.name?.charAt(0).toUpperCase()}</div>
              <div className="member-info">
                <span className="member-name">{m.name}</span>
                <span className="member-role">{m.role}</span>
                {chat.admin?._id === m._id && (
                  <span className="admin-badge">Admin</span>
                )}
              </div>
              {isAdmin && m._id !== currentUser._id && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveMember(m._id)}
                  title="Remove member"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Messages Area ── */}
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
            chatMembers={chat.members}
          />
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span /><span /><span />
            </span>
            <span className="typing-text">
              {typingUsers.map((u) => u.name).join(", ")} is typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ── */}
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
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            ➤
          </button>
        </div>

        {/* Group name shown BELOW input box (as per spec) */}
        {chat.isGroup && (
          <div className="group-name-bar">
            <span className="group-icon">👥</span>
            <span>{chat.groupName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
