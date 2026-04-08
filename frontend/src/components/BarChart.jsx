// frontend/src/components/BarChart.jsx
// SVG 기반 바 차트 (외부 라이브러리 없이 동작)

export default function BarChart({ data = [], label = "" }) {
  if (!data.length) return null;

  const W = 700, H = 300, PAD = { top: 20, right: 20, bottom: 60, left: 60 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  const max  = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(4, innerW / data.length - 6);

  const x = (i) => PAD.left + i * (innerW / data.length) + (innerW / data.length - barW) / 2;
  const y = (v) => PAD.top  + innerH * (1 - v / max);
  const h = (v) => innerH   * (v / max);

  // Y축 눈금 5개
  const ticks = Array.from({ length: 5 }, (_, i) => max * (i + 1) / 5);

  return (
    <div className="chart-area" style={{ overflowX: "auto" }}>
      <p style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: 8 }}>
        {label.toUpperCase()} — 상위 {data.length}건
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
        {/* 배경 그리드 */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)}
              stroke="#252a35" strokeWidth="1"
            />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end"
              fill="#5a6478" fontSize="10" fontFamily="'Share Tech Mono', monospace">
              {t.toLocaleString()}
            </text>
          </g>
        ))}

        {/* 바 */}
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={x(i)} y={y(d.value)}
              width={barW} height={h(d.value)}
              fill="var(--accent)" fillOpacity="0.75" rx="3"
            />
            {/* 값 라벨 (충분한 높이가 있을 때만) */}
            {h(d.value) > 20 && (
              <text
                x={x(i) + barW / 2} y={y(d.value) - 4}
                textAnchor="middle" fill="var(--accent)" fontSize="10"
                fontFamily="'Share Tech Mono', monospace"
              >
                {Number(d.value).toLocaleString()}
              </text>
            )}
            {/* X축 라벨 */}
            <text
              x={x(i) + barW / 2} y={H - PAD.bottom + 16}
              textAnchor="middle" fill="#5a6478" fontSize="10"
              fontFamily="'Noto Sans KR', sans-serif"
              transform={`rotate(-30, ${x(i) + barW / 2}, ${H - PAD.bottom + 16})`}
            >
              {String(d.label).slice(0, 12)}
            </text>
          </g>
        ))}

        {/* 축 선 */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#252a35" strokeWidth="1" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#252a35" strokeWidth="1" />
      </svg>
    </div>
  );
}
