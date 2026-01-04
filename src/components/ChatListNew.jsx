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
  className={`chat-item ${activeChat === chat.id ? "active" : ""}`}
  onClick={() => onSelectChat(chat.id)}
>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span
        className={`status-dot ${
          otherUser?.isOnline ? "online" : "offline"
        }`}
      />
      <b>{otherUser?.name || "User"}</b>
    </div>

  <div className="last-msg">
    {chat.lastMessage || "No messages yet"}
  </div>
</div>
  );
};

/*  MAIN CHAT LIST */
const ChatListNew = ({ onSelectChat, onNewChat ,activeChat}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  if (!user) return null;

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
  onClick={onNewChat}
  className="new-chat-btn"
>
  + New Chat
</button>
      </div>

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