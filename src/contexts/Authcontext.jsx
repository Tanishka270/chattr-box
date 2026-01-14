import React, { useEffect, useState, useContext } from "react";
import { auth, db } from "../components/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const AuthContext = React.createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    //Firebase listener
    const unsub = auth.onAuthStateChanged(async (u) => {
    if (u) {
  const snap = await getDoc(doc(db, "users", u.uid));

  setUser({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    ...(snap.exists() ? snap.data() : {}),
  });

        await setDoc(
          doc(db, "users", u.uid),
          {
            uid: u.uid,
            name: u.displayName || "User",
            email: u.email,
            photoURL: u.photoURL || "",
            createdAt: serverTimestamp(),
            isOnline: true,            // online status
            lastSeen: serverTimestamp(),
          },
          { merge: true } //  do not overwrite existing data
        );
      }
      
        //  USER LOGGED OUT
    else {
      const guest = localStorage.getItem("guestUser");
      if (guest) {
        setUser(JSON.parse(guest));
      } else {
        setUser(null);
      }
}

    });


    
    //  handleOffline function add ,  Page close / refresh hone par offline mark
const handleOffline = async () => {
  if (auth.currentUser) {
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        isOnline: false,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  }
};
 //Browser close / refresh detect
window.addEventListener("beforeunload", handleOffline);


    // 🧹Cleanup,firebase listener remove
return () => {
  window.removeEventListener("beforeunload", handleOffline);
  unsub();
};

  }, []);

  if (user === undefined) return null;

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};