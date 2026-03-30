// ============================================================
// FILE: client/src/App.jsx  (YOUR EXISTING FILE)
// ADD the lines marked with ✅
// ============================================================

// ✅ 1. Add this import near the top with your other imports:
import ChatPage from "./pages/ChatPage";

// ✅ 2. Inside your <Routes> block, add this route:
//    (alongside your existing routes like "/" and "/login")

/*
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/login" element={<Login />} />

    ✅ ADD THIS:
    <Route path="/chat" element={<ChatPage />} />

  </Routes>
*/

// ✅ 3. In your Navbar or Dashboard component, add a Chat link:
//    Using React Router's Link or useNavigate:

/*
  import { Link } from "react-router-dom";

  // Inside your navbar JSX:
  <Link to="/chat">💬 Chat</Link>

  // OR using a button + useNavigate:
  const navigate = useNavigate();
  <button onClick={() => navigate("/chat")}>💬 Chat</button>
*/

// ✅ 4. (Optional but recommended) Disconnect socket on logout:
//    In your logout handler, add:

/*
  import { disconnectSocket } from "./socket/socket";

  const handleLogout = () => {
    disconnectSocket();      // ✅ ADD THIS LINE
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
*/
