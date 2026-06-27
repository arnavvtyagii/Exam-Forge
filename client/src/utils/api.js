const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

function getToken() {
  return localStorage.getItem("ef_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),

  // Study sets
  getStudySets: () => request("/study-sets"),
  getStudySet: (id) => request(`/study-sets/${id}`),
  createStudySet: (body) => request("/study-sets", { method: "POST", body }),
  deleteStudySet: (id) => request(`/study-sets/${id}`, { method: "DELETE" }),

  // Sessions
  startSession: (body) => request("/sessions", { method: "POST", body }),
  submitAttempt: (sessionId, body) =>
    request(`/sessions/${sessionId}/attempt`, { method: "POST", body }),
  completeSession: (sessionId) =>
    request(`/sessions/${sessionId}/complete`, { method: "PATCH" }),
  getSessions: () => request("/sessions"),

  // Analytics
  getAnalytics: () => request("/analytics/overview"),
};
