import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/Authcontext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { setDoc, serverTimestamp } from "firebase/firestore";


/*  Single Chat Row */
const ChatUserItem = ({ chat, currentUserId, onSelectChat,activeChat }) => {
  const [otherUser, setOtherUser] = useState(null);

const isActive = activeChat === chat.id;

const isUnread =
  chat.lastSenderId &&
  chat.lastSenderId !== currentUserId &&
  !isActive;

  useEffect(() => {
    const otherUserId = chat.members.find(
      (id) => id !== currentUserId
    );
    if (!otherUserId) return;


    //  Listen in real-time to other user's data
    const unsub = onSnapshot(doc(db, "users", otherUserId), (snap) => {
      setOtherUser(snap.data());
    });
    

    return () => unsub();
  }, [chat.members, currentUserId]);

  return (
 <div
 className={`chat-item ${isActive ? "active" : ""} ${
  isUnread ? "unread" : ""
}`}
  onClick={() => onSelectChat(chat.id)}
>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span
        className={`status-dot ${
          otherUser?.isOnline ? "online" : "offline"
        }`}
      />
    <b>
  {otherUser?.username ||
   otherUser?.displayName ||
   otherUser?.name ||
   "User"}
</b>
    </div>

  <div className="last-msg-row">
  <span className="last-msg">
    {chat.lastMessage || "No messages yet"}
  </span>

  {isUnread && <span className="new-badge">NEW</span>}
</div>
</div>
  );
};

/*  MAIN CHAT LIST */
const ChatListNew = ({ onSelectChat, onNewChat ,activeChat}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
const [showLoginHint, setShowLoginHint] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid)
    );


   const unsub = onSnapshot(q, (snapshot) => {
  const list = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // sorting acc to new mssg arrive
  list.sort(
    (a, b) =>
      (b.updatedAt?.seconds || 0) -
      (a.updatedAt?.seconds || 0)
  );

  setChats(list);
});

    return () => unsub();
  }, [user]);

  if (!user) return null;


  const handleNewChatClick = () => {
  onNewChat(); // normal user ke liye
};

  return (
    <div style={{ width: "300px", borderRight: "1px solid #ddd" }}>
      {/* 🔴 LOGOUT */}
      <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
        
<button
  onClick={async () => {
    await setDoc(
  doc(db, "users", user.uid),
  {
    isOnline: false,
    lastSeen: serverTimestamp(),
  },
  { merge: true }
);
    await signOut(auth);
    navigate("/login");
  }}
  className="logout-btn"
>
  Logout
</button>
      </div>

      {/*  NEW CHAT (ONLY OPEN USERS) */}
      <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
        <button
  onClick={ handleNewChatClick}
  className="new-chat-btn"
>
  
  + New Chat
</button>
      </div>

      {showLoginHint && user?.isGuest && (
  <div className="login-hint">
    <p>Login to start a new chat ✨</p>
    <button
      className="login-hint-btn"
      onClick={() => navigate("/login")}
    >
      Sign in with Google
    </button>
  </div>
)}

      {/*  CHAT LIST */}
      <h3 style={{ padding: "10px", margin: 0 }}>Chats</h3>

      {chats.map((chat) => (
        <ChatUserItem
          key={chat.id}
          chat={chat}
          currentUserId={user.uid}
            activeChat={activeChat}
          onSelectChat={onSelectChat}
        />
      ))}
    </div>
  );
};

export default ChatListNew;