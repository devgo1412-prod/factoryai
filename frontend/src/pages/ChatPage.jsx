// frontend/src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "안녕하세요! 공장 AI Copilot입니다. 무엇이든 물어보세요." }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await api.chat(text);
      setMessages(m => [...m, { role: "bot", text: res.answer }]);
    } catch (e) {
      setMessages(m => [...m, { role: "bot", text: `❌ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrap">
      <p className="page-title">💬 AI Chat</p>
      <p className="page-sub">LLM 서버와 직접 대화합니다.</p>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="msg bot">
            <div className="msg-bubble"><span className="spinner" /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="메시지를 입력하세요… (Enter로 전송)"
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
          전송
        </button>
        <button className="btn btn-secondary" onClick={() => setMessages([messages[0]])}>
          초기화
        </button>
      </div>
    </div>
  );
}
