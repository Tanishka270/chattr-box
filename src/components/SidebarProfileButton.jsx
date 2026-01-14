import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Authcontext";
import "./SidebarProfileButton.css";

const SidebarProfileButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="sidebar-profile-wrapper">
      <button
        className="sidebar-profile-btn"
        onClick={() => navigate("/profile")}
      >
        <div className="sidebar-profile-avatar">
          {user?.avatar || "👤"}
        </div>
        <div className="sidebar-profile-text">
          <div className="sidebar-profile-name">
            {user?.username || "My Profile"}
          </div>
          <div className="sidebar-profile-sub">
            View profile
          </div>
        </div>
      </button>
    </div>
  );
};

export default SidebarProfileButton;