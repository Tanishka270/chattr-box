import React from "react";
import { GoogleOutlined, FacebookOutlined } from "@ant-design/icons";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "./firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate(); 


  //This function logs the user in using Google, and after a successful login, redirects them to the /chats page.
  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    navigate("/chats"); 
  };

  const handleGuestLogin = () => {
  const guestUser = {
    uid: "guest_" + Date.now(), // unique id for guest
    displayName: "Guest User",
    isGuest: true,
  };

  // save guest user info in local storage
  localStorage.setItem("guestUser", JSON.stringify(guestUser));

  // Redirect to chats page
  navigate("/chats");
};

  return (
    <div id="login-page">
      <div id="login-card">
        <h2>Welcome to Chattr 👋</h2>

        <div
          className="login-button google"
          onClick={loginWithGoogle}
        >
          <GoogleOutlined /> Sign in with Google
        </div>

        <br /><br />
        <button
          className="guest-btn"
          onClick={handleGuestLogin}
        >
          👤 Continue as Guest
        </button>
            </div>
    </div>
  );
};

export default Login;
