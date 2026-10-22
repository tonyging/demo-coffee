import { displayName, esc, roastLabel } from './text';

/** 相對亮度（WCAG），用來決定袋身上的字要用淺色還是深色 */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function inkOn(hex: string): string {
  return luminance(hex) > 0.28 ? '#1E1611' : '#F3EDE4';
}

export interface BagInput {
  name: string;
  origin: string;
  region?: string;
  process?: string;
  roast: number;
  weight: number;
  bagColor: string;
  seriesLabel?: string; // 例如 SINGLE ORIGIN
}

const PAPER = '#F3EDE4';
const INK = '#1E1611';
const MUTED = '#6A5D52';

function splitName(name: string): string[] {
  const t = name.trim();
  if (t.includes(' ')) {
    const i = t.indexOf(' ');
    return [t.slice(0, i), t.slice(i + 1)];
  }
  if (t.length > 6) {
    const m = Math.ceil(t.length / 2);
    return [t.slice(0, m), t.slice(m)];
  }
  return [t];
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/**
 * 咖啡豆袋 SVG。標籤上的名稱、產地、烘焙度、袋身顏色全部由資料生成。
 * idPrefix 避免同一頁多個袋子的 gradient id 重複。
 */
export function renderBag(b: BagInput, idPrefix = 'bag'): string {
  const color = /^#[0-9a-f]{6}$/i.test(b.bagColor) ? b.bagColor : '#B5562B';
  const on = inkOn(color);
  const lines = splitName(b.name || '—');
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const fs = Math.max(15, Math.min(lines.length === 1 ? 30 : 26, Math.floor(128 / maxLen)));
  const lh = fs * 1.15;
  const y0 = lines.length === 1 ? 168 : 156;
  const nameSvg = lines
    .map(
      (l, i) =>
        `<text class="bag-name" x="120" y="${(y0 + i * lh).toFixed(1)}" text-anchor="middle" font-size="${fs}" fill="${INK}">${esc(l)}</text>`
    )
    .join('');
  const nameBottom = y0 + (lines.length - 1) * lh;
  const info1Y = Math.max(nameBottom + 22, 214); // 底列基線 = info1Y+52 ≤ 266，離標籤紙下緣(272)留 6
  const level = Math.min(5, Math.max(1, Math.round(b.roast)));
  const dots = [0, 1, 2, 3, 4]
    .map((i) => {
      const cx = 120 + (i - 2) * 13;
      return i < level
        ? `<circle cx="${cx}" cy="${info1Y + 30}" r="3.4" fill="${INK}"/>`
        : `<circle cx="${cx}" cy="${info1Y + 30}" r="3" fill="none" stroke="${MUTED}" stroke-width="1"/>`;
    })
    .join('');
  const id = esc(idPrefix);
  const meta = [b.region && b.region !== '綜合' ? b.region : '', b.process].filter(Boolean).join(' · ');

  return `<svg class="bag" viewBox="0 0 240 320" role="img" aria-label="${esc(displayName(b.name))} 咖啡豆袋，${esc(b.origin)}，${roastLabel(level)}" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="${id}-sh" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".22" stop-color="#fff" stop-opacity="0"/>
<stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/>
</linearGradient>
<linearGradient id="${id}-fd" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".12" stop-color="#000" stop-opacity="0"/>
<stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/>
</linearGradient>
<clipPath id="${id}-cp"><path d="M34 22H206C213 92 214 204 208 291Q120 312 32 291C26 204 27 92 34 22Z"/></clipPath>
</defs>
<ellipse cx="120" cy="305" rx="84" ry="8" fill="#000" opacity=".14"/>
<g clip-path="url(#${id}-cp)">
<rect x="20" y="10" width="200" height="310" fill="${color}"/>
<rect x="20" y="10" width="200" height="310" fill="url(#${id}-sh)"/>
<rect x="20" y="10" width="200" height="310" fill="url(#${id}-fd)"/>
<rect x="20" y="22" width="200" height="24" fill="#000" opacity=".10"/>
<path d="M20 28H220M20 34H220M20 40H220" stroke="${on}" stroke-opacity=".28" stroke-width=".8" stroke-dasharray="1.2 2.6"/>
<path d="M20 46H220" stroke="#000" stroke-opacity=".22" stroke-width="1"/>
<path d="M34 281Q120 294 206 281" stroke="#000" stroke-opacity=".14" fill="none"/>
</g>
<path d="M30 50l7 3-7 3z" fill="#000" opacity=".25"/>
<text class="bag-mono" x="50" y="73" font-size="7.5" letter-spacing="1.6" fill="${on}" fill-opacity=".9">LAN’AN ROASTERY</text>
<circle cx="188" cy="69" r="6.5" fill="#000" fill-opacity=".18"/><circle cx="188" cy="69" r="3.2" fill="${on}" fill-opacity=".5"/>
<rect x="48" y="90" width="144" height="182" fill="${PAPER}"/>
<rect x="48" y="90" width="144" height="7" fill="${color}"/>
<text class="bag-mono" x="120" y="118" text-anchor="middle" font-size="7.5" letter-spacing="1.8" fill="${MUTED}">${esc((b.seriesLabel || 'COFFEE').toUpperCase())}</text>
<path d="M62 126H178" stroke="${INK}" stroke-opacity=".25"/>
${nameSvg}
<text class="bag-sans" x="120" y="${info1Y.toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="500" fill="${INK}">${esc(clip(b.origin, 12))}</text>
<text class="bag-sans" x="120" y="${(info1Y + 13).toFixed(1)}" text-anchor="middle" font-size="8.5" fill="${MUTED}">${esc(clip(meta, 16))}</text>
${dots}
<path d="M62 ${(info1Y + 40).toFixed(1)}H178" stroke="${INK}" stroke-opacity=".25"/>
<text class="bag-mono" x="62" y="${(info1Y + 52).toFixed(1)}" font-size="7.5" letter-spacing="1" fill="${MUTED}">${esc(String(b.weight))}G</text>
<text class="bag-sans" x="178" y="${(info1Y + 52).toFixed(1)}" text-anchor="end" font-size="8" fill="${MUTED}">${roastLabel(level)}</text>
</svg>`;
}
