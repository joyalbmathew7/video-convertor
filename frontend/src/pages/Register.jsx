import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api/v1`;

function Register({
  onLoginClick,
  onGuestClick,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Object.values(data)
          .flat()
          .join(" ");
        alert(message || "Registration failed");
        return;
      }

      alert("Registration successful. Please log in.");
      onLoginClick();
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to backend.");
    }
  };

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={handleRegister}>
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
          Register
        </button>
      </form>

      <br />

      <button
        type="button"
        onClick={onLoginClick}
      >
        Already have an account? Login
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

export default Register;
