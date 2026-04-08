// frontend/src/App.jsx
import { useState } from "react";
import ChatPage    from "./pages/ChatPage";
import RagPage     from "./pages/RagPage";
import DBPage      from "./pages/DBPage";
import StatusBar   from "./components/StatusBar";
import "./App.css";

const NAV = [
  { id: "chat", label: "AI Chat",       icon: "💬" },
  { id: "rag",  label: "문서 검색",      icon: "🔍" },
  { id: "db",   label: "데이터 분석",    icon: "📊" },
];

export default function App() {
  const [page, setPage] = useState("chat");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">eMAS<br/><em>AI Copilot</em></span>
        </div>
        <nav>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-btn ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>
        <StatusBar />
      </aside>

      <main className="content">
        {page === "chat" && <ChatPage />}
        {page === "rag"  && <RagPage />}
        {page === "db"   && <DBPage />}
      </main>
    </div>
  );
}
