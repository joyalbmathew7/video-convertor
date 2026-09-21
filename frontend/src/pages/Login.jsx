import { useState } from "react";
import { API_BASE_URL } from "../api";

function Login({
  onRegisterClick,
  onGuestClick,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        alert(data.detail || "Login failed");
        return;
      }

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      onLoginSuccess();
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Unable to connect to backend."
      );
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <br />
        <br />

        <button type="submit">
          Login
        </button>
      </form>

      <br />

      <button
        type="button"
        onClick={onRegisterClick}
      >
        Register
      </button>

      <br />
      <br />

      <button
        type="button"
        onClick={onGuestClick}
      >
        Continue as Guest
      </button>
    </div>
  );
}

export default Login;
