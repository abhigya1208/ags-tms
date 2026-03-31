import React from "react";

const MessageBubble = ({ message, isOwn, showSender, chatMembers }) => {
  // Sender Name logic with fallback
  const senderName =
    typeof message.senderId === "object"
      ? message.senderId?.name
      : chatMembers?.find((m) => m._id === message.senderId)?.name || "Unknown";

  // Time formatting
  const time = message.createdAt 
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Seen status logic
  const senderIdStr = typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
  const seenByOthers = (message.seenBy || []).filter((id) => id !== senderIdStr);
  const isSeen = seenByOthers.length > 0;

  // FIX: Support both 'text' and 'content' fields
  const messageText = message.content || message.text || "";

  if (!messageText && !message.image) return null; // Don't render empty bubbles

  return (
    <div className={`bubble-wrapper ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        <div className="bubble-avatar">
          {senderName?.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="bubble-content">
        {showSender && !isOwn && (
          <p className="bubble-sender">{senderName}</p>
        )}

        <div className={`bubble ${isOwn ? "bubble-own" : "bubble-other"}`}>
          <p className="bubble-text">{messageText}</p>
        </div>

        <div className="bubble-meta">
          <span className="bubble-time">{time}</span>
          {isOwn && (
            <span className={`seen-tick ${isSeen ? "seen" : ""}`}>
              {isSeen ? "✔✔" : "✔"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;