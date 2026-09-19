import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

function App() {
  const [showRegister, setShowRegister] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("access_token") !== null
  );

  const [isGuest, setIsGuest] = useState(false);

  // Logged-in user
  if (isLoggedIn) {
    return (
      <Home
        isLoggedIn={true}
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
