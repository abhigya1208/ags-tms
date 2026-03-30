# AGS Chat Module — Integration Guide

## 📦 New Files Overview

```
server/
├── models/
│   ├── Chat.js            ← New
│   └── Message.js         ← New
├── controllers/
│   └── chatController.js  ← New
├── routes/
│   └── chatRoutes.js      ← New
├── socket/
│   └── chatSocket.js      ← New
├── middleware/
│   └── authMiddleware.js  ← New (for chat routes)
└── INDEX_JS_INTEGRATION.js ← Read this, then edit your index.js

client/src/
├── pages/
│   └── ChatPage.jsx       ← New
├── components/chat/
│   ├── ChatList.jsx        ← New
│   ├── ChatWindow.jsx      ← New
│   ├── MessageBubble.jsx   ← New
│   ├── GroupModal.jsx      ← New
│   └── Chat.css            ← New
├── socket/
│   └── socket.js          ← New
└── APP_JSX_INTEGRATION.js ← Read this, then edit your App.jsx
```

---

## ⚙️ Step 1 — Install Dependencies

### Backend (run inside your `server/` folder):
```bash
npm install socket.io jsonwebtoken
```

### Frontend (run inside your `client/` folder):
```bash
npm install socket.io-client
```

---

## ⚙️ Step 2 — Environment Variables

Add these to your **server/.env** file (or wherever you store env vars):

```env
JWT_SECRET=your_existing_jwt_secret_here   # Same one used for login
CLIENT_URL=http://localhost:3000           # Your React dev URL
```

> ⚠️ JWT_SECRET MUST match the secret you already use when signing tokens at login. Don't change it — just make sure it's in .env.

---

## ⚙️ Step 3 — Copy Files into Your Project

**Backend** — copy these into your existing `server/` folder:
- `models/Chat.js`
- `models/Message.js`
- `controllers/chatController.js`
- `routes/chatRoutes.js`
- `socket/chatSocket.js`
- `middleware/authMiddleware.js`

**Frontend** — copy these into your existing `client/src/` folder:
- `pages/ChatPage.jsx`
- `components/chat/ChatList.jsx`
- `components/chat/ChatWindow.jsx`
- `components/chat/MessageBubble.jsx`
- `components/chat/GroupModal.jsx`
- `components/chat/Chat.css`
- `socket/socket.js`

---

## ⚙️ Step 4 — Edit server/index.js

Open your existing `server/index.js` and make these 6 small changes:

```js
// 1. Add imports at the top
const http = require("http");
const { Server } = require("socket.io");
const chatRoutes = require("./routes/chatRoutes");
const { initChatSocket } = require("./socket/chatSocket");

// 2. After: const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// 3. With your other route registrations
app.use("/api/chat", chatRoutes);

// 4. After routes
initChatSocket(io);

// 5. Replace app.listen(...) with:
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## ⚙️ Step 5 — Edit client/src/App.jsx

```jsx
// 1. Add import
import ChatPage from "./pages/ChatPage";

// 2. Add route inside <Routes>
<Route path="/chat" element={<ChatPage />} />
```

---

## ⚙️ Step 6 — Add Chat Link to Navbar

In your existing Navbar component:
```jsx
import { Link } from "react-router-dom";

<Link to="/chat">💬 Chat</Link>
```

---

## ⚙️ Step 7 — (Optional) Disconnect Socket on Logout

In your logout function:
```js
import { disconnectSocket } from "./socket/socket";

const handleLogout = () => {
  disconnectSocket(); // ← add this
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Server starts without errors
- [ ] `GET /api/chat` returns 200 (with valid JWT)
- [ ] `/chat` route opens ChatPage in browser
- [ ] Two users can exchange messages in real time
- [ ] Typing indicator appears
- [ ] ✔✔ seen ticks work
- [ ] Online/Offline status updates
- [ ] Group can be created with 2-15 members
- [ ] Only admin can remove members / delete group
- [ ] Notifications pop up when receiving message in background

---

## 🔑 Auth Integration Notes

- Socket uses the **same token from localStorage** — no new auth needed
- Token payload must contain: `_id`, `name`, `role`
- If your JWT payload uses different field names (e.g. `id` instead of `_id`), update `chatSocket.js` and `authMiddleware.js` accordingly

---

## 💬 User Model Assumption

This module uses your existing `User` model via `mongoose.model("User")`.
Make sure your User model is registered in your project before the chat routes load (it almost certainly is — just making sure).

---

## 🧹 MongoDB TTL

Messages auto-delete after 365 days via a TTL index on the `expiresAt` field.
MongoDB's background task runs this cleanup approximately once per minute.
No manual maintenance needed.
