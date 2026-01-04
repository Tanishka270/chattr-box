import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import ChatPage from "./ChatPage";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "../contexts/Authcontext";

function App() {
  return (
    <BrowserRouter>

       {/* AuthProvider wraps the app to share logged-in user data */}
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;