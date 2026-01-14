import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileIncomplete.css";

const ProfileIncomplete = () => {
  const navigate = useNavigate();

  return (
    <div className="profile-incomplete-page">
      <div className="profile-incomplete-card">
        <h2>Welcome 👋</h2>
        <p>
          Let’s set up your profile so people can recognize you
          and chat comfortably.
        </p>

        <button
          className="complete-profile-btn"
          onClick={() => navigate("/profile")}
        >
          Create your profile
        </button>
      </div>
    </div>
  );
};

export default ProfileIncomplete;