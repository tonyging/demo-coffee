import { roastLabel } from './format';

const CX = 160;
const CY = 140;
const R = 88;

/** 風味雷達：酸度、甜度、醇厚、烘焙（1–5），由資料生成 */
export function renderRadar(v: { acidity: number; sweetness: number; body: number; roast: number }): string {
  const axes = [
    { key: 'acidity', label: '酸度', dx: 0, dy: -1 },
    { key: 'sweetness', label: '甜度', dx: 1, dy: 0 },
    { key: 'body', label: '醇厚', dx: 0, dy: 1 },
    { key: 'roast', label: '烘焙', dx: -1, dy: 0 },
  ] as const;
  const pt = (a: (typeof axes)[number], val: number) =>
    `${(CX + a.dx * R * (val / 5)).toFixed(1)},${(CY + a.dy * R * (val / 5)).toFixed(1)}`;
  const ring = (val: number) => axes.map((a) => pt(a, val)).join(' ');
  const rings = [1, 2, 3, 4, 5].map((n) => `<polygon class="rd-ring${n === 5 ? ' is-outer' : ''}" points="${ring(n)}"/>`).join('');
  const spokes = axes.map((a) => `<line class="rd-axis" x1="${CX}" y1="${CY}" x2="${CX + a.dx * R}" y2="${CY + a.dy * R}"/>`).join('');
  const data = axes.map((a) => pt(a, v[a.key])).join(' ');
  const dots = axes
    .map((a) => {
      const [x, y] = pt(a, v[a.key]).split(',');
      return `<circle class="rd-dot" cx="${x}" cy="${y}" r="3.5"/>`;
    })
    .join('');
  const labels = axes
    .map((a) => {
      const x = CX + a.dx * (R + 16);
      const y = CY + a.dy * (R + 18) + (a.dy === 0 ? 4 : a.dy > 0 ? 8 : -22);
      const anchor = a.dx > 0 ? 'start' : a.dx < 0 ? 'end' : 'middle';
      const text = a.key === 'roast' ? roastLabel(v.roast) : `${v[a.key]}/5`;
      return `<text class="rd-label" x="${x}" y="${y}" text-anchor="${anchor}">${a.label}</text><text class="rd-val" x="${x}" y="${y + 18}" text-anchor="${anchor}">${text}</text>`;
    })
    .join('');
  return `<svg class="radar" viewBox="-16 -20 352 316" role="img" aria-label="風味評分：酸度 ${v.acidity}、甜度 ${v.sweetness}、醇厚 ${v.body}（滿分 5），${roastLabel(v.roast)}" xmlns="http://www.w3.org/2000/svg">${rings}${spokes}<polygon class="rd-area" points="${data}"/>${dots}${labels}</svg>`;
}

/** 烘焙刻度：淺 → 深，標記目前位置 */
export function renderRoastScale(level: number): string {
  const steps = ['淺', '淺中', '中', '中深', '深'];
  const x = (i: number) => 24 + i * 72;
  const mx = x(Math.min(5, Math.max(1, level)) - 1);
  const stops = steps
    .map(
      (s, i) =>
        `<line class="rs-tick" x1="${x(i)}" x2="${x(i)}" y1="34" y2="46"/><text class="rs-label${i === level - 1 ? ' is-on' : ''}" x="${x(i)}" y="64" text-anchor="middle">${s}</text>`
    )
    .join('');
  return `<svg class="roast-scale" viewBox="0 -8 336 84" role="img" aria-label="烘焙度：${roastLabel(level)}" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="rs-g" x1="0" x2="1"><stop offset="0" stop-color="#D9B98A"/><stop offset=".5" stop-color="#8A5A34"/><stop offset="1" stop-color="#2A1A10"/></linearGradient></defs>
<rect class="rs-bar" x="24" y="30" width="288" height="6" rx="3" fill="url(#rs-g)"/>
${stops}
<g class="rs-marker" style="--mx:${mx}px"><path d="M${mx} 27l-6-12h12z" class="rs-flag"/><text class="rs-now" x="${mx}" y="10" text-anchor="middle">${roastLabel(level)}</text></g>
</svg>`;
}
