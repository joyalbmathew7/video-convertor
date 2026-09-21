const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api/v1`;

let refreshRequest = null;

function getAccessToken() {
  return localStorage.getItem("access_token");
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        localStorage.setItem("access_token", data.access);
        return data.access;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

export async function authenticatedFetch(url, options = {}) {
  const requestOptions = { ...options };
  const headers = new Headers(requestOptions.headers || {});
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  requestOptions.headers = headers;
  let response = await fetch(url, requestOptions);

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();

  if (!refreshedToken) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth-expired"));
    return response;
  }

  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  return fetch(url, {
    ...options,
    headers: retryHeaders,
  });
}

export { API_BASE_URL };
