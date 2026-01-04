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

   const loginwithfacebook = async () => {
    await signInWithPopup(auth, facebookProvider);
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

        <div
          className="login-button facebook"
          onClick={() => loginwithfacebook(auth, facebookProvider)}
        >
          <FacebookOutlined /> Sign in with Facebook
        </div>
      </div>
    </div>
  );
};

export default Login;
