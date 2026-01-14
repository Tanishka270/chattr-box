import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { useAuth } from "../contexts/Authcontext";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,   
} from "firebase/firestore";

const UsersList = ({ onSelectChat, onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);


  // Fetch all users in real-time
  //   - Excludes the current logged-in user
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(
        snap.docs
         .map((d) => d.data())
.filter(
  (u) =>
    u.uid &&             
    u.name &&            
    u.uid !== user.uid
)
      );
    });

    return () => unsub();
  }, [user]);


  //  Start or open a chat with another user
const startChat = async (otherUser) => {
  if (!user?.uid || !otherUser?.uid) {
    return;
  }

  // 1. Check if a chat already exists with this user
  const q = query(
    collection(db, "chats"),
    where("members", "array-contains", user.uid)
  );

  const snap = await getDocs(q);
  let existingChatId = null;

  snap.forEach((doc) => {
    const members = doc.data().members;
    if (
      members.length === 2 &&
      members.includes(otherUser.uid)
    ) {
      existingChatId = doc.id;
    }
  });

  // 2.  If chat exists  → open karo
  if (existingChatId) {
    onSelectChat(existingChatId,otherUser);
    onClose(); // users list band
    return;
  }

  //  3. If chat does NOT exist → create a new one
  const chatRef = await addDoc(collection(db, "chats"), {
    members: [user.uid, otherUser.uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "",
  });

onSelectChat(chatRef.id, otherUser);
  onClose();
};

  return (
    <div style={{ width: "300px", borderRight: "1px solid #ddd" }}>
      <h3 style={{ padding: "10px" }}>Start New Chat</h3>

{users.map((u) => (
  <div
    key={u.uid}
    onClick={() => startChat(u)}
    className="user-item" 
  >
    <span
      className={`status-dot ${u.isOnline ? "online" : "offline"}`}
    />

    <div className="user-info">
     <b>
  {u.username || u.displayName || u.name || "User"}
</b>
      <div className="user-email">{u.email}</div>
    </div>
  </div>
))}
    </div>
  );
};

export default UsersList;