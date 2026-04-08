// frontend/src/api/client.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "서버 오류");
  }
  return res.json();
}

export const api = {
  // Chat
  chat:      (prompt, system = "") => request("/api/chat",    { method: "POST", body: JSON.stringify({ prompt, system }) }),
  pingLLM:   ()                    => request("/api/chat/ping"),

  // DB
  query:     (sql, max_rows = 5000) => request("/api/db/query",  { method: "POST", body: JSON.stringify({ sql, max_rows }) }),
  nl2sql:    (question)             => request("/api/db/nl2sql", { method: "POST", body: JSON.stringify({ question }) }),
  pingDB:    ()                     => request("/api/db/ping"),

  // RAG
  ragSearch: (query, k = 3, with_answer = true) =>
    request("/api/rag/search", { method: "POST", body: JSON.stringify({ query, k, with_answer }) }),

  // Health
  health:    () => request("/api/health"),
};
