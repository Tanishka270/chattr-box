import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import "./ChatPage.css";
import ChatListNew from "./ChatListNew";
import UsersList from "./UsersList";
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

const ChatPage = () => {
  const { user } = useAuth();

  const [activeChat, setActiveChat] = useState(null);
  const [showUsers, setShowUsers] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null); //  jis message pe delete click hua
const [showDeleteMenu, setShowDeleteMenu] = useState(false);
const [showMsgMenu, setShowMsgMenu] = useState(false);// to show/hide message menu

  const bottomRef = useRef(null);


//reply to 
  const handleReply = (msg) => {

  setReplyTo({
    
    id: msg.id,
    text: msg.text,
    senderId: msg.senderId,
  });
};

const cancelReply = () => {
  setReplyTo(null);
};

  //  SEND MESSAGE
  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    await addDoc(collection(db, "chats", activeChat, "messages"), {
      text: message,
      senderId: user.uid,
      createdAt: serverTimestamp(),
       deletedFor: [],              
      deletedForEveryone: false
    });

    await updateDoc(doc(db, "chats", activeChat), {
      lastMessage: message,
      updatedAt: serverTimestamp(),
    });

    setMessage("");
  };

  //  READ MESSAGES
  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, "chats", activeChat, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [activeChat]);

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

  return (
   <div className={`chat-layout ${activeChat ? "chat-open" : ""}`}>
      {/* LEFT SIDEBAR */}
      <div>
        {!showUsers ? (
          <ChatListNew activeChat={activeChat} 
            onSelectChat={(id) => {
              setActiveChat(id);
              setShowUsers(false);
            }}
            onNewChat={() => setShowUsers(true)}
          />
        ) : (
          <UsersList
            onSelectChat={(id) => {
              setActiveChat(id);
              setShowUsers(false);
            }}
            onClose={() => setShowUsers(false)}
          />
        )}
      </div>

      {/* RIGHT CHAT */}
      <div className="chat-container">
        {activeChat ? (
          <>
            <div className="chat-header">
  <span
    className="mobile-back"
    onClick={() => setActiveChat(null)}
  >
    ←
  </span>

  <span>Chat</span>

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

                      onClick={() => handleReply(msg)} // reply to message on click

                      onContextMenu={(e) => {                   //  delete menu
                          setReplyTo(null); 
                          e.preventDefault();
                          setSelectedMsg(msg);
                          setShowDeleteMenu(true);
    }}
                >
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
 
    <button
      onClick={() => {
        setShowMsgMenu(false);
    handleReply(selectedMsg);
      }}
    >
      Reply
    </button>

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