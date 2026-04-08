// frontend/src/components/LineChart.jsx
// 날짜/시계열 컬럼 대응 SVG 라인 차트

export default function LineChart({ data = [], xKey = "", yKey = "" }) {
  if (!data.length) return null;

  const W = 700, H = 300, PAD = { top: 20, right: 20, bottom: 60, left: 70 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  const values = data.map(d => Number(d[yKey]) || 0);
  const minV   = Math.min(...values);
  const maxV   = Math.max(...values, minV + 1);

  const cx = (i) => PAD.left + (i / (data.length - 1 || 1)) * innerW;
  const cy = (v) => PAD.top  + innerH * (1 - (v - minV) / (maxV - minV));

  // 폴리라인 포인트
  const points = data.map((d, i) => `${cx(i)},${cy(Number(d[yKey]) || 0)}`).join(" ");

  // 그라디언트 채우기용 path
  const areaPath =
    `M ${cx(0)},${PAD.top + innerH} ` +
    data.map((d, i) => `L ${cx(i)},${cy(Number(d[yKey]) || 0)}`).join(" ") +
    ` L ${cx(data.length - 1)},${PAD.top + innerH} Z`;

  // Y축 눈금
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + ((maxV - minV) * (i + 1)) / 5);

  // X축 라벨 — 너무 많으면 간격 조정
  const step  = Math.max(1, Math.floor(data.length / 8));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="chart-area" style={{ overflowX: "auto" }}>
      <p style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: 8 }}>
        {yKey.toUpperCase()} 추이
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 그리드 */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={cy(t)} x2={W - PAD.right} y2={cy(t)}
              stroke="#252a35" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.left - 8} y={cy(t) + 4} textAnchor="end"
              fill="#5a6478" fontSize="10" fontFamily="'Share Tech Mono', monospace">
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : Math.round(t)}
            </text>
          </g>
        ))}

        {/* 면 채우기 */}
        <path d={areaPath} fill="url(#lineGrad)" />

        {/* 라인 */}
        <polyline points={points} fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinejoin="round" />

        {/* 데이터 포인트 (20개 이하일 때만) */}
        {data.length <= 20 && data.map((d, i) => (
          <circle key={i} cx={cx(i)} cy={cy(Number(d[yKey]) || 0)}
            r="4" fill="#00e5ff" stroke="var(--bg)" strokeWidth="2" />
        ))}

        {/* X축 라벨 */}
        {xLabels.map((d, i) => {
          const origIdx = data.indexOf(d);
          return (
            <text key={i}
              x={cx(origIdx)} y={H - PAD.bottom + 16}
              textAnchor="middle" fill="#5a6478" fontSize="10"
              fontFamily="'Noto Sans KR', sans-serif"
              transform={`rotate(-30, ${cx(origIdx)}, ${H - PAD.bottom + 16})`}>
              {String(d[xKey]).slice(0, 14)}
            </text>
          );
        })}

        {/* 축 */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#252a35" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#252a35" />
      </svg>
    </div>
  );
}
