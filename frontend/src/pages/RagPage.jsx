// frontend/src/pages/RagPage.jsx
import { useState } from "react";
import { api } from "../api/client";

export default function RagPage() {
  const [query,   setQuery]   = useState("");
  const [k,       setK]       = useState(3);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [open,    setOpen]    = useState({});

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null); setOpen({});
    try {
      const r = await api.ragSearch(query, k, true);
      setResult(r);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  return (
    <div>
      <p className="page-title">🔍 문서 검색 (RAG)</p>
      <p className="page-sub">인덱싱된 문서에서 유사 내용을 찾고 AI가 종합 답변을 생성합니다.</p>

      {/* 검색 입력 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <input
            className="grow"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="검색어를 입력하세요… (예: 설비 점검 절차)"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>결과 수</span>
            <select value={k} onChange={e => setK(Number(e.target.value))} style={{ width: 60 }}>
              {[1,2,3,5,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={search} disabled={loading || !query.trim()}>
            {loading ? <span className="spinner" /> : "검색"}
          </button>
        </div>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>❌ {error}</div>}

      {/* AI 종합 답변 */}
      {result?.answer && (
        <div className="card" style={{ marginBottom: 16, borderColor: "rgba(0,229,255,0.3)" }}>
          <div className="card-title">🤖 AI 종합 답변</div>
          <p style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result.answer}</p>
        </div>
      )}

      {/* 검색 결과 문서 카드 */}
      {result?.docs?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
            참조 문서 {result.docs.length}건
          </p>
          {result.docs.map((doc, i) => (
            <div key={i} className="rag-card">
              <div className="rag-card-header" onClick={() => setOpen(o => ({ ...o, [i]: !o[i] }))}>
                <span style={{ fontSize: 13 }}>
                  📄 문서 {i + 1}
                  {doc.source && <span style={{ color: "var(--text-dim)", marginLeft: 8, fontSize: 11 }}>{doc.source}</span>}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badge-accent">
                    유사도 {(Math.max(0, 1 - doc.score) * 100).toFixed(1)}%
                  </span>
                  <span style={{ color: "var(--text-dim)" }}>{open[i] ? "▲" : "▼"}</span>
                </div>
              </div>
              {open[i] && <div className="rag-card-body">{doc.content}</div>}
            </div>
          ))}
        </div>
      )}

      <hr className="divider" />
      <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
        문서 인덱싱: <code style={{ fontFamily: "var(--mono)", background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>python ingest.py ./docs/파일명.txt --reset</code>
      </p>
    </div>
  );
}
