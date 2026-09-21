import { useState } from "react";
import { API_BASE_URL, authenticatedFetch } from "../api";

function VideoConverter() {
  // -----------------------------
  // Resolution converter state
  // -----------------------------

  const [video, setVideo] = useState(null);
  const [resolution, setResolution] = useState("480p");
  const [format, setFormat] = useState("mp4");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadTime, setUploadTime] = useState(null);
  const [conversionTime, setConversionTime] = useState(null);

  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");

  // -----------------------------
  // FPS converter state
  // -----------------------------

  const [fpsVideo, setFpsVideo] = useState(null);
  const [fpsStatus, setFpsStatus] = useState("");
  const [fpsLoading, setFpsLoading] = useState(false);
  const [fpsVideoId, setFpsVideoId] = useState(null);

  const [fpsUploadTime, setFpsUploadTime] = useState(null);
  const [fpsConversionTime, setFpsConversionTime] = useState(null);

  const [fpsError, setFpsError] = useState("");

  // -----------------------------
  // Resolution conversion
  // -----------------------------

  const handleConvert = () => {
    if (!video) {
      setError("Please select a video.");
      return;
    }

    setLoading(true);
    setStatus("Uploading... 0%");
    setError("");
    setDownloadUrl("");
    setUploadTime(null);
    setConversionTime(null);

    const formData = new FormData();

    formData.append("video", video);
    formData.append("output_format", format);
    formData.append("resolution", resolution);

    const xhr = new XMLHttpRequest();

    const uploadStartTime = performance.now();
    let uploadFinishedTime = null;

    xhr.open(
      "POST",
      `${API_BASE_URL}/videos/public/convert/`
    );

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round(
          (event.loaded / event.total) * 100
        );

        setStatus(`Uploading... ${percent}%`);
      }
    });

    xhr.upload.addEventListener("load", () => {
      uploadFinishedTime = performance.now();

      const seconds =
        (uploadFinishedTime - uploadStartTime) / 1000;

      setUploadTime(seconds);

      setStatus("Converting... Please wait");
    });

    xhr.addEventListener("load", () => {
      const conversionFinishedTime = performance.now();

      if (uploadFinishedTime !== null) {
        const seconds =
          (conversionFinishedTime - uploadFinishedTime) / 1000;

        setConversionTime(seconds);
      }

      let data;

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        setError("Invalid response from backend.");
        setStatus("");
        setLoading(false);
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        setError(data.error || "Conversion failed.");
        setStatus("");
        setLoading(false);
        return;
      }

      setStatus("Conversion complete!");

      setDownloadUrl(
        `${API_BASE_URL.replace("/api/v1", "")}${data.download_url}`
      );

      setLoading(false);
    });

    xhr.addEventListener("error", () => {
      console.error("Upload/conversion error");

      setError("Unable to connect to backend.");
      setStatus("");
      setLoading(false);
    });

    xhr.addEventListener("abort", () => {
      setError("Upload was cancelled.");
      setStatus("");
      setLoading(false);
    });

    xhr.send(formData);
  };

  // -----------------------------
  // Resolution download
  // -----------------------------

  const handleDownload = async () => {
    try {
      setStatus("Preparing download...");

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = `${video.name.split(".")[0]}_${resolution}.${format}`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      setStatus("Download started.");
    } catch (error) {
      console.error(error);

      setError("Unable to download the converted video.");
    }
  };

  // -----------------------------
  // Increase FPS
  // -----------------------------

  const handleFPSConvert = async () => {
  if (!fpsVideo) {
    setFpsError("Please select a video.");
    return;
  }

  const accessToken = localStorage.getItem("access_token");

  if (!accessToken) {
    setFpsError("Please login to use FPS conversion.");
    return;
  }

  setFpsError("");
  setFpsStatus("");
  setFpsVideoId(null);
  setFpsLoading(true);

  try {
    const formData = new FormData();

    formData.append(
      "original_file",
      fpsVideo
    );

    const uploadResponse = await authenticatedFetch(
      `${API_BASE_URL}/videos/upload/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    const uploadData =
      await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(
        uploadData.detail ||
        uploadData.error ||
        "Upload failed"
      );
    }

    const videoId = uploadData.id;

    if (!videoId) {
      throw new Error("Backend did not return a video ID.");
    }

    setFpsStatus(
      "Upload complete. Converting to 60 FPS..."
    );

    const conversionStartTime =
      performance.now();

    const response = await authenticatedFetch(
      `${API_BASE_URL}/videos/${videoId}/increase-fps/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail ||
        result.error ||
        "FPS conversion failed"
      );
    }

    const conversionEndTime =
      performance.now();

    setFpsConversionTime(
      (conversionEndTime - conversionStartTime) / 1000
    );

    setFpsStatus(
      "60 FPS conversion complete!"
    );

    setFpsVideoId(videoId);

  } catch (error) {
    console.error(
      "FPS conversion error:",
      error
    );

    setFpsError(
      error.message ||
      "FPS conversion failed."
    );
  } finally {
    setFpsLoading(false);
  }
};

  const handleFPSDownload = async () => {
    if (!fpsVideoId) {
      setFpsError("No converted video is available.");
      return;
    }

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setFpsError("Please login to download the video.");
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/videos/${fpsVideoId}/download/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `${fpsVideo.name.split(".")[0]}_60fps.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setFpsStatus("Download started.");
    } catch (error) {
      console.error(error);
      setFpsError("Unable to download the converted video.");
    }
  };
  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div>

      {/* ========================= */}
      {/* Resolution converter      */}
      {/* ========================= */}

      <section>
        <h2>Reduce Video Resolution</h2>

        <p>
          Reduce your video resolution using FFmpeg.
        </p>

        <p>
          No login required.
        </p>

        <input
          type="file"
          accept="video/*"
          disabled={loading}
          onChange={(e) => {
            setVideo(e.target.files[0]);
            setDownloadUrl("");
            setError("");
            setStatus("");
            setUploadTime(null);
            setConversionTime(null);
          }}
        />

        <br />
        <br />

        <label>Resolution: </label>

        <select
          value={resolution}
          disabled={loading}
          onChange={(e) =>
            setResolution(e.target.value)
          }
        >
          <option value="360p">360p</option>
          <option value="480p">480p</option>
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
        </select>

        <br />
        <br />

        <label>Format: </label>

        <select
          value={format}
          disabled={loading}
          onChange={(e) =>
            setFormat(e.target.value)
          }
        >
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="webm">WebM</option>
        </select>

        <br />
        <br />

        <button
          onClick={handleConvert}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Reduce Resolution"}
        </button>

        {loading && (
          <div>
            <br />

            <div className="spinner"></div>

            <p>{status}</p>

            {status ===
              "Converting... Please wait" && (
              <p>
                Your video is being converted.
                Please wait...
              </p>
            )}
          </div>
        )}

        {uploadTime !== null && (
          <p>
            Upload time:{" "}
            {uploadTime.toFixed(1)} seconds
          </p>
        )}

        {conversionTime !== null && (
          <p>
            Conversion time:{" "}
            {conversionTime.toFixed(1)} seconds
          </p>
        )}

        {!loading &&
          status === "Conversion complete!" && (
            <div>
              <h3>Conversion complete!</h3>

              <button onClick={handleDownload}>
                Download Video
              </button>
            </div>
          )}

        {!loading &&
          status === "Download started." && (
            <p>
              Your download has started.
            </p>
          )}

        {error && <p>{error}</p>}
      </section>

      <hr />

      {/* ========================= */}
      {/* FPS converter             */}
      {/* ========================= */}

      <section>
        <h2>Increase Video FPS</h2>

        <p>
          Increase your video to 60 FPS using RIFE
          frame interpolation.
        </p>

        <p>
          Login required.
        </p>

        <input
          type="file"
          accept="video/*"
          disabled={fpsLoading}
          onChange={(e) => {
            setFpsVideo(e.target.files[0]);
            setFpsVideoId(null);
            setFpsError("");
            setFpsStatus("");
            setFpsUploadTime(null);
            setFpsConversionTime(null);
          }}
        />

        <br />
        <br />

        <button
          onClick={handleFPSConvert}
          disabled={fpsLoading}
        >
          {fpsLoading
            ? "Processing..."
            : "Increase to 60 FPS"}
        </button>

        {fpsLoading && (
          <div>
            <br />

            <div className="spinner"></div>

            <p>{fpsStatus}</p>

            {fpsStatus ===
              "Converting to 60 FPS... Please wait" && (
              <p>
                RIFE is generating intermediate
                frames. Please wait...
              </p>
            )}
          </div>
        )}

        {fpsUploadTime !== null && (
          <p>
            Upload time:{" "}
            {fpsUploadTime.toFixed(1)} seconds
          </p>
        )}

        {fpsConversionTime !== null && (
          <p>
            RIFE conversion time:{" "}
            {fpsConversionTime.toFixed(1)} seconds
          </p>
        )}

        {!fpsLoading && fpsVideoId && (
            <div>
              <h3>
                60 FPS conversion complete!
              </h3>

              <button
                onClick={handleFPSDownload}
              >
                Download 60 FPS Video
              </button>
            </div>
        )}

        {!fpsLoading &&
          fpsStatus === "Download started." && (
            <p>
              Your download has started.
            </p>
          )}

        {fpsError && (
          <p>{fpsError}</p>
        )}
      </section>

    </div>
  );
}

export default VideoConverter;
