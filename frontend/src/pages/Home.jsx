
import VideoConverter from "./VideoConverter";
import { useState } from "react";

function Home({ isLoggedIn, onLogout, onLogin, onDeleteAccount }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteError("");

    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(error.message || "Unable to delete account.");
    }
  };

  return (
    <div>
      <h1>Video Converter</h1>

      <p>
        Convert your videos easily.
      </p>

      {isLoggedIn ? (
        <div>
          <button onClick={onLogout}>
            Logout
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Account
            </button>
          ) : (
            <div>
              <p>This permanently deletes your account. Continue?</p>

              <button
                type="button"
                onClick={handleDeleteAccount}
              >
                Confirm Delete Account
              </button>

              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          )}

          {deleteError && <p>{deleteError}</p>}
        </div>
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

      <VideoConverter isLoggedIn={isLoggedIn} />
    </div>
  );
}

export default Home;
