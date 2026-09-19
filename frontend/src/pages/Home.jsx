
import VideoConverter from "./VideoConverter";

function Home({ isLoggedIn, onLogout, onLogin }) {
  return (
    <div>
      <h1>Video Converter</h1>

      <p>
        Convert your videos easily.
      </p>

      {isLoggedIn ? (
        <button onClick={onLogout}>
          Logout
        </button>
      ) : (
        <div>
          <p>
            You are using the site as a guest.
          </p>

          <button onClick={onLogin}>
            Login
          </button>
        </div>
      )}

      <br />
      <br />

      <VideoConverter />
    </div>
  );
}

export default Home;
