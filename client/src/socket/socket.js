import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

let socket = null;

/**
 * Returns a connected socket instance.
 * Reads token from localStorage (reusing your existing auth).
 * Call this once when user enters the chat page.
 */
export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      socket.emit("join_my_rooms");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });
  }

  return socket;
};

/**
 * Disconnect and destroy socket instance.
 * Call when user logs out.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
