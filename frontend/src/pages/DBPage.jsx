// frontend/src/pages/DBPage.jsx
import { useState } from "react";
import { api } from "../api/client";
import BarChart     from "../components/BarChart";
import LineChart    from "../components/LineChart";
import SummaryCards from "../components/SummaryCards";

const DEFAULT_SQL = "SELECT TOP 50 * FROM your_table";

export default function DBPage() {
  const [sql,     setSql]     = useState(DEFAULT_SQL);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [nlInput, setNlInput] = useState("");
  const [nlLoad,  setNlLoad]  = useState(false);
  const [tab,     setTab]     = useState("table");
  const [barCol,  setBarCol]  = useState("");
  const [lineX,   setLineX]   = useState("");
  const [lineY,   setLineY]   = useState("");

  const runQuery = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await api.query(sql);
      setResult(r);
      setBarCol(r.numeric_cols?.[0] || "");
      setLineX(r.date_cols?.[0] || r.columns?.[0] || "");
      setLineY(r.numeric_cols?.[0] || "");
      setTab("table");
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  const genSQL = async () => {
    if (!nlInput.trim()) return;
    setNlLoad(true);
    try {
      const r = await api.nl2sql(nlInput);
      setSql(r.sql);
    } catch (e) { setError(e.message); }
    finally { setNlLoad(false); }
  };

  const downloadCSV = () => {
    if (!result) return;
    const header = result.columns.join(",");
    const rows   = result.rows.map(r =>
      result.columns.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "result.csv";
    a.click();
  };

  const tabs = [
    { id: "table",   label: "📋 표" },
    ...(result?.numeric_cols?.length                              ? [{ id: "summary", label: "📊 요약 통계" }]  : []),
    ...(result?.numeric_cols?.length                              ? [{ id: "bar",     label: "📊 막대 차트" }]  : []),
    ...(result?.numeric_cols?.length && result?.columns?.length > 1 ? [{ id: "line", label: "📈 라인 차트" }]  : []),
  ];

  const barData  = result && barCol
    ? result.rows.slice(0, 30).map((r, i) => ({ label: String(r[result.columns[0]] ?? i), value: Number(r[barCol]) || 0 }))
    : [];
  const lineData = result && lineX && lineY ? result.rows.slice(0, 100) : [];

  return (
    <div>
      <p className="page-title">📊 데이터 분석</p>
      <p className="page-sub">SQL 결과를 표 · 요약 통계 · 막대 · 라인 차트로 확인합니다.</p>

      {/* 자연어 → SQL */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🤖 자연어 → SQL 생성</div>
        <div className="row">
          <input className="grow" value={nlInput} onChange={e => setNlInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && genSQL()}
            placeholder="예: 지난달 라인별 생산량 합계를 보여줘" />
          <button className="btn btn-secondary" onClick={genSQL} disabled={nlLoad || !nlInput.trim()}>
            {nlLoad ? <span className="spinner" /> : "SQL 생성"}
          </button>
        </div>
      </div>

      {/* SQL 에디터 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">SQL 에디터</div>
        <textarea value={sql} onChange={e => setSql(e.target.value)} rows={5} />
        <p className="sql-hint">※ SELECT / WITH / EXEC 만 허용됩니다.</p>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={runQuery} disabled={loading}>
            {loading ? <><span className="spinner" />&nbsp;실행 중…</> : "▶ 실행"}
          </button>
          {result && <button className="btn btn-secondary" onClick={downloadCSV}>📥 CSV 다운로드</button>}
        </div>
      </div>

      {error && (
        <div style={{ color:"var(--danger)", background:"rgba(255,71,87,0.08)", border:"1px solid rgba(255,71,87,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="card">
          {/* 헤더 */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span className="card-title" style={{ margin:0 }}>결과</span>
              <span className="badge badge-accent">{result.total.toLocaleString()}행</span>
              {result.truncated && <span className="badge badge-danger">5,000행 제한</span>}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {tabs.map(t => (
                <button key={t.id}
                  className={`btn ${tab === t.id ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding:"6px 12px", fontSize:12 }}
                  onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 표 */}
          {tab === "table" && (
            <div className="tbl-wrap">
              <table>
                <thead><tr>{result.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>{result.columns.map(c => <td key={c}>{String(row[c] ?? "")}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 요약 통계 */}
          {tab === "summary" && (
            <SummaryCards rows={result.rows} numericCols={result.numeric_cols} />
          )}

          {/* 막대 차트 */}
          {tab === "bar" && (
            <div>
              <div style={{ marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:12, color:"var(--text-dim)" }}>Y축 컬럼:</span>
                <select value={barCol} onChange={e => setBarCol(e.target.value)} style={{ width:"auto" }}>
                  {result.numeric_cols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <BarChart data={barData} label={barCol} />
            </div>
          )}

          {/* 라인 차트 */}
          {tab === "line" && (
            <div>
              <div style={{ marginBottom:12, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--text-dim)" }}>X축:</span>
                  <select value={lineX} onChange={e => setLineX(e.target.value)} style={{ width:"auto" }}>
                    {result.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--text-dim)" }}>Y축:</span>
                  <select value={lineY} onChange={e => setLineY(e.target.value)} style={{ width:"auto" }}>
                    {result.numeric_cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <LineChart data={lineData} xKey={lineX} yKey={lineY} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
