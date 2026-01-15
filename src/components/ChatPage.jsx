import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import "./ChatPage.css";
import ChatListNew from "./ChatListNew";
import UsersList from "./UsersList";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/Authcontext";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import ProfileIncomplete from "./ProfileIncomplete";
import { isProfileComplete } from "../utilities/profilestatus";
import { getDoc } from "firebase/firestore";
import Profile from "./Profile";
import SidebarProfileButton from "./SidebarProfileButton";






const ChatPage = () => {
  const { user } = useAuth();
 const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState(null);
  const [showUsers, setShowUsers] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null); //  jis message pe delete click hua
const [showDeleteMenu, setShowDeleteMenu] = useState(false);
const [showMsgMenu, setShowMsgMenu] = useState(false);// to show/hide message menu
const [showLoginPrompt, setShowLoginPrompt] = useState(false);
const [showProfile, setShowProfile] = useState(false); // to show/hide profile
const [chatUser, setChatUser] = useState(null);  


  const bottomRef = useRef(null);


//reply to 
  const handleReply = (msg) => {
  if (!activeChat) return;
  if (msg.chatId && msg.chatId !== activeChat) return;
      if (msg.deletedForEveryone) return;

  setReplyTo({
    id: msg.id,
    text: msg.text,
    senderId: msg.senderId,
     senderName:
    msg.senderId === user.uid
      ? "You"
      : msg.senderName || "User",
  });
};

const cancelReply = () => {
  setReplyTo(null);
};

  //  SEND MESSAGE
  const sendMessage = async () => {
      // 🚫 Guest user restriction
  if (user?.isGuest) {
    setMessage("");    
    setReplyTo(null);
    setShowLoginPrompt(true);
    return;
  }
    if (!message.trim() || !activeChat) return;


  const msg = message;   // save text
  setMessage("");        // ✅ INPUT TURANT CLEAR
  // setReplyTo(null);

    await addDoc(collection(db, "chats", activeChat, "messages"), {
      text: msg,
      senderId: user.uid,
        senderName: user.displayName || "You",
      createdAt: serverTimestamp(),
       deletedFor: [],              
      deletedForEveryone: false,
      

        replyTo: replyTo
      ? {
          id: replyTo.id,
          text: replyTo.text,
          senderId: replyTo.senderId,
           senderName: replyTo.senderName,
        }
      : null,
    });

    await updateDoc(doc(db, "chats", activeChat), {
      lastMessage: msg,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(), 
      readBy: [user.uid], 
    });

    setMessage("");
    setReplyTo(null);
  };

  //  READ MESSAGES
// READ MESSAGES
useEffect(() => {
  if (!activeChat || !user) return;

  const q = query(
    collection(db, "chats", activeChat, "messages"),
    orderBy("createdAt")
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    const msgs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setMessages(msgs);

    if (msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];

    // 🔥 receiver side chat top pe lane ke liye
    if (lastMsg.senderId !== user.uid) {
      await updateDoc(doc(db, "chats", activeChat), {
        lastMessage: lastMsg.text,
         lastSenderId: lastMsg.senderId,
        updatedAt: serverTimestamp(),
      });
    }
  });

  return () => unsub();
}, [activeChat, user]);

  //  AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //  DELETE CURRENT CHAT (users stay, only chat removed)
  const deleteCurrentChat = async () => {
    if (!activeChat) return;

    const snap = await getDocs(
      collection(db, "chats", activeChat, "messages")
    );

    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }

    await deleteDoc(doc(db, "chats", activeChat));
    setActiveChat(null);
    alert("Chat deleted");
  };

  // DELETE FOR ME

  const handleDeleteForMe = async () => {
  if (!selectedMsg || !activeChat) return;

  await updateDoc(
    doc(db, "chats", activeChat, "messages", selectedMsg.id),
     {
      deletedFor: [...(selectedMsg.deletedFor || []), user.uid],
    }
  );
 setReplyTo(null); 
  setShowDeleteMenu(false);
  setSelectedMsg(null);
};


// DELETE FOR EVERYONE
const handleDeleteForEveryone = async () => {
  if (!selectedMsg || !activeChat) return;

  // safety: only sender can delete for everyone
  if (selectedMsg.senderId !== user.uid) return;

  await updateDoc(
    doc(db, "chats", activeChat, "messages", selectedMsg.id),
    {
      text: "This message was deleted",
      deletedForEveryone: true,
    }
  );
setReplyTo(null); 
  setShowDeleteMenu(false);
  setSelectedMsg(null);
};


  if (!user) return <div>Loading...</div>;
  if (user &&  !user.isGuest && !isProfileComplete(user)) {
  return <ProfileIncomplete />;
}

  const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    setShowLoginPrompt(false); // popup band
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => { // chat change pe reply cancel
  setReplyTo(null);
  setSelectedMsg(null);
  setShowMsgMenu(false);
  setShowDeleteMenu(false);
}, [activeChat]);



  return (
   <div className={`chat-layout ${activeChat ? "chat-open" : ""}`}>
      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-scroll">
        {!showUsers ? (
              <ChatListNew
        activeChat={activeChat}
       onSelectChat={async (chatId) => {
  setActiveChat(chatId);
    setChatUser(null); 
  setShowUsers(false);
  setShowProfile(false);

  const chatSnap = await getDoc(doc(db, "chats", chatId));
  if (!chatSnap.exists()) return;

  const chatData = chatSnap.data();


  const otherUserId = chatData.members.find(
    (uid) => uid !== user.uid
  );

  if (!otherUserId) return;

  const userSnap = await getDoc(doc(db, "users", otherUserId));
  if (userSnap.exists()) {
    setChatUser(userSnap.data());
  }
}}
       onNewChat={() => setShowUsers(true)}
      />
        ) : (
        <UsersList
  onSelectChat={(chatId, otherUser) => {
    setActiveChat(chatId);
      setReplyTo(null);
    setChatUser(otherUser);  
    setShowUsers(false);
    setShowProfile(false);
  }}
  onClose={() => setShowUsers(false)}
/>
        )}
          </div>

         <SidebarProfileButton />
      </div>

      {/* RIGHT CHAT */}
      <div className="chat-container">
{activeChat ? (
  showProfile ? (
    <Profile
    profileUser={chatUser}
    onBack={() => setShowProfile(false)}
  />
  ) : (
          <>
            <div className="chat-header">


<span
  className="mobile-back"
  onClick={() => {
    setShowProfile(false);
    setActiveChat(null);
  }}
>
  ←
</span>
          

  <div
  className="chat-user"
  onClick={() => setShowProfile(true)}
>
  <div className="chat-avatar">
   {chatUser?.avatar || "👤"}
  </div>
  <span className="chat-username">
    <h3>
  {chatUser?.username || chatUser?.displayName || chatUser?.name || "User"}
</h3>
  </span>
  {/* <p>{chatUser?.status}</p>
<p>{chatUser?.bio}</p> */}
</div>


  {user?.isGuest && (
  <span className="guest-badge">
    Guest Mode
  </span>
)}

  <button
    className="delete-chat-btn"
    onClick={deleteCurrentChat}
  >
    🗑️ Delete Chat
  </button>
</div>



            <div className="chat-messages">
              {messages  .filter( // filter out messages deleted for me
                  (msg) =>
                    !msg.deletedFor?.includes(user.uid)
                )
              
                .map((msg) => ( // display messages
                <div
                  key={msg.id}
                  className={`message ${
                    msg.senderId === user.uid ? "me" : "other"
                  }`}

                      onClick={() => {// reply to message on click
                        if (!msg.deletedForEveryone) {
                         handleReply(msg);
                       }
                      }
  }  

                      onContextMenu={(e) => {                   //  delete menu
                          setReplyTo(null); 
                          e.preventDefault();
                          setSelectedMsg(msg);
                          setShowDeleteMenu(true);
    }}
                >

                  {msg.replyTo && (
  <div className="reply-bubble-inline">
    <div className="reply-sender">
      Replying to {
  msg.replyTo.senderName ||
  (msg.replyTo.senderId === user.uid ? "You" : "User")
}
    </div>
    <div className="reply-text">
      {msg.replyTo.text}
    </div>
  </div>
)}


                  {msg.deletedForEveryone ? (
                      <i style={{ color: "#888", fontStyle: "italic" }}>
                        This message was deleted
                      </i>
                    ) : (
                      msg.text
                    )}
                    <span
                        className="msg-menu-arrow"
                        onClick={(e) => {
                          e.stopPropagation();   // message click se reply na ho
                          setSelectedMsg(msg);
                          setShowMsgMenu(true);  
                        }}
                      >
  ⌄
          </span>



{showMsgMenu && (
  <div
    className="msg-overlay"
    onClick={() => setShowMsgMenu(false)}
  />
)}

          {/* // MESSAGE MENU (REPLY / DELETE) */}
{showMsgMenu && selectedMsg ?.id === msg.id && (

  
    <div
      className="msg-context-menu"
    >
 {!selectedMsg?.deletedForEveryone && (
    <button
      onClick={() => {
        setShowMsgMenu(false);
    handleReply(selectedMsg);
      }}
    >
      Reply
    </button>
 )}
    <button
      onClick={() => {
         setReplyTo(null); 
        setShowMsgMenu(false);
        setShowDeleteMenu(true); // second popup
      }}
    >
      Delete
    </button>

   </div>
  
)}



                  <div className="time">
                    {msg.createdAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))} 
              <div ref={bottomRef} />
            </div>



{/* // DELETE MESSAGE MENU */}

{showDeleteMenu && selectedMsg && (
  <div
    className="delete-overlay"
    onClick={() => {setShowDeleteMenu(false);
       setReplyTo(null); 
    }}
  >
    <div
      className="delete-popup"
      onClick={(e) => e.stopPropagation()}
    >

      {selectedMsg.senderId === user.uid && (
        <button
          className="delete-everyone"
          onClick={handleDeleteForEveryone}
        >
          Delete for everyone
        </button>
      )}

      <button
        className="delete-me"
        onClick={handleDeleteForMe}
      >
        Delete for me
      </button>

      <button
        className="delete-cancel"
        onClick={() => setShowDeleteMenu(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}


{/*  LOGIN REQUIRED POPUP */}
{showLoginPrompt && (
  <div className="login-popup-overlay">
    <div className="login-popup">
      <h3>Login required</h3>
      <p>
        Guest users can explore chats,  
        but to send messages you need to sign in.
      </p>

      <button
        className="login-popup-btn"
        onClick={loginWithGoogle}
      >
        Sign in with Google
      </button>

      <button
        className="login-popup-cancel"
        onClick={() => setShowLoginPrompt(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

{replyTo && (
  <div className="reply-preview">
    <div className="reply-bar" />
    
    <div className="reply-content">
      <div className="reply-label">Replying to</div>
      <div className="reply-text">{replyTo.text}</div>
    </div>

    <button className="reply-close" onClick={cancelReply}>✕</button>
  </div>
  
)}



            <div className="chat-input">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>

            
          </>

          
           )
        ) : (
  <div className="empty-state">
    <div className="empty-illustration">
      <div className="bubble back"></div>
      <div className="bubble front"></div>

      <span className="dot d1"></span>
      <span className="dot d2"></span>
      <span className="dot d3"></span>
      <span className="plus p1">+</span>
      <span className="plus p2">+</span>
    </div>

    <h2>It's nice to chat with someone</h2>
    <p>start your conversation</p>
  </div>
)}
      </div>
    </div>
  );
};

export default ChatPage;