import React from "react";

const MessageBubble = ({ message, isOwn, showSender, chatMembers }) => {
  const senderName =
    typeof message.senderId === "object"
      ? message.senderId?.name
      : chatMembers?.find((m) => m._id === message.senderId)?.name || "Unknown";

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Seen status: message is "seen" if at least one OTHER person has seen it
  const seenByOthers = (message.seenBy || []).filter(
    (id) => id !== message.senderId?._id && id !== message.senderId
  );
  const isSeen = seenByOthers.length > 0;

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
          <p className="bubble-text">{message.text}</p>
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
