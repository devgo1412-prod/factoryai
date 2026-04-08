// frontend/src/components/StatusBar.jsx
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function StatusBar() {
  const [llm, setLlm] = useState(null);   // null=미확인 true/false
  const [db,  setDb]  = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "") + "/api/health/detail")
      .then(r => r.json())
      .then(d => { setLlm(d.llm?.ok ?? false); setDb(d.db?.ok ?? false); })
      .catch(() => { setLlm(false); setDb(false); });
  }, []);

  const Dot = ({ val }) => (
    <span className={`dot ${val === null ? "dot-gray" : val ? "dot-green" : "dot-red"}`} />
  );

  return (
    <div className="status-bar">
      <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4, fontFamily: "var(--mono)", letterSpacing:"0.08em" }}>
        CONNECTION
      </div>
      <div className="status-item">
        <span>LLM Server</span>
        <Dot val={llm} />
      </div>
      <div className="status-item">
        <span>MSSQL</span>
        <Dot val={db} />
      </div>
    </div>
  );
}
