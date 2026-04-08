// frontend/src/components/SummaryCards.jsx
// 숫자 컬럼 자동 집계 (합계, 평균, 최대, 최소) 카드

export default function SummaryCards({ rows = [], numericCols = [] }) {
  if (!rows.length || !numericCols.length) return null;

  // 컬럼당 최대 4개까지만 표시
  const cols = numericCols.slice(0, 4);

  const stats = cols.map(col => {
    const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const sum  = vals.reduce((a, b) => a + b, 0);
    const avg  = sum / vals.length;
    const max  = Math.max(...vals);
    const min  = Math.min(...vals);
    return { col, sum, avg, max, min, count: vals.length };
  }).filter(Boolean);

  const fmt = (v) => {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + "K";
    return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cols.length, 2)}, 1fr)`, gap: 12, marginBottom: 16 }}>
      {stats.map(s => (
        <div key={s.col} style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "14px 16px",
        }}>
          <div style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--mono)", letterSpacing: "0.08em", marginBottom: 10 }}>
            {s.col.toUpperCase()}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "합계", value: fmt(s.sum), color: "var(--accent)" },
              { label: "평균", value: fmt(s.avg), color: "var(--text)" },
              { label: "최대", value: fmt(s.max), color: "var(--success)" },
              { label: "최소", value: fmt(s.min), color: "var(--accent2)" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontFamily: "var(--mono)", fontWeight: "bold", color: item.color }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8, textAlign: "right" }}>
            {s.count.toLocaleString()}행 기준
          </div>
        </div>
      ))}
    </div>
  );
}
