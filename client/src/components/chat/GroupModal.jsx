import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const GroupModal = ({ onClose, onGroupCreated, authHeaders, currentUser }) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/chat/users`, { headers: authHeaders });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("fetchUsers error:", err);
    }
  };

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setError("");
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selected.length < 2) {
      setError("Select at least 2 members");
      return;
    }
    if (selected.length + 1 > 15) {
      setError("Maximum 15 members allowed");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/group`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ groupName: groupName.trim(), members: selected }),
      });
      const group = await res.json();
      if (!res.ok) {
        setError(group.message || "Failed to create group");
        return;
      }
      onGroupCreated(group);
    } catch (err) {
      console.error("createGroup error:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Group</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <input
            className="modal-input"
            type="text"
            placeholder="Group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={40}
          />

          <p className="modal-label">
            Select members ({selected.length}/14 — max 15 including you)
          </p>

          <div className="modal-user-list">
            {users.map((u) => {
              const isSelected = selected.includes(u._id);
              return (
                <div
                  key={u._id}
                  className={`modal-user-item ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleSelect(u._id)}
                >
                  <div className="avatar sm">{u.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="user-name">{u.name}</p>
                    <p className="user-role">{u.role}</p>
                  </div>
                  {isSelected && <span className="check-icon">✔</span>}
                </div>
              );
            })}
          </div>

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
