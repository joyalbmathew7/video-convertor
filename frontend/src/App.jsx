import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import { API_BASE_URL, authenticatedFetch } from "./api";

function App() {
  const [showRegister, setShowRegister] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("access_token") !== null
  );

  const [isGuest, setIsGuest] = useState(false);

  const handleDeleteAccount = async () => {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/auth/delete-account/`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      let message = "Unable to delete account.";

      try {
        const data = await response.json();
        message = data.detail || data.error || message;
      } catch {
        // Keep the default message for an empty error response.
      }

      throw new Error(message);
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    setIsGuest(false);
    setShowRegister(false);
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsLoggedIn(false);
      setIsGuest(false);
      setShowRegister(false);
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  // Logged-in user
  if (isLoggedIn) {
    return (
      <Home
        isLoggedIn={true}
        onDeleteAccount={handleDeleteAccount}
        onLogout={() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          setIsLoggedIn(false);
          setIsGuest(false);
          setShowRegister(false);
        }}
      />
    );
  }

  // Guest user
  if (isGuest) {
  return (
    <Home
      isLoggedIn={false}
      onLogin={() => {
        setIsGuest(false);
        setShowRegister(false);
      }}
    />
  );
}

  // Register page
  if (showRegister) {
    return (
      <Register
        onLoginClick={() => setShowRegister(false)}
        onGuestClick={() => setIsGuest(true)}
      />
    );
  }

  // Login page
  return (
    <Login
      onRegisterClick={() => setShowRegister(true)}
      onGuestClick={() => setIsGuest(true)}
      onLoginSuccess={() => setIsLoggedIn(true)}
    />
  );
}

export default App;
