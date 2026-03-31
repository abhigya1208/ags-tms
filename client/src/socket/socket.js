import { io } from "socket.io-client";

// URL logic to prevent /api/socket issues
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const SOCKET_URL = BASE_URL.endsWith('/api') ? BASE_URL.replace('/api', '') : BASE_URL;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("ags_token"); // Updated to your ags_token key

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      withCredentials: true
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};