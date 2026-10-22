/**
 * 社群分享圖（og:image，1200×630）：建置時用 resvg 把 SVG 轉成 PNG。
 *
 * - 品牌卡（og.png）：字型用 src/assets/og-fonts/ 裡事先裁好的子集，內容固定，建置時一定產得出來。
 * - 豆子卡（og/beans/<slug>.png）：每款豆子用自己的豆袋（bag.ts）。字型在建置時向 Google Fonts 要「只含用到的字」的子集，
 *   所以後台新增的品名也不會變豆腐字；抓不到字型（離線等）就回傳 null，詳細頁的 og:image 退回品牌卡。
 * - 主體都收在中間 630×630 的安全區（x 285–915），被裁成 2:1 或 1:1 時重點不會被切掉。
 */
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderBag } from './bag';
import { displayName, esc, roastLabel } from './text';
import type { Bean, SiteData } from './types';

export const OG_W = 1200;
export const OG_H = 630;

const C = {
  bg: '#F3EDE4',
  ink: '#1E1611',
  ink2: '#5A4D43',
  accent: '#B5562B',
  accentInk: '#9A4520',
  rule: 'rgba(30,22,17,.2)',
};
const ROAST = ['#D9B98A', '#B98A55', '#8A5A34', '#5A3822', '#2A1A10'];

const FONT_CSS = `
.bag-name,.serif{font-family:'Noto Serif TC';font-weight:700}
.bag-mono,.mono{font-family:'DM Mono'}
.bag-sans,.sans{font-family:'Noto Sans TC'}
.italic{font-family:'Cormorant Garamond','Cormorant Garamond Medium';font-style:italic;font-weight:500}
`;

/* ───────── 字型 ───────── */
const FAMILIES = [
  { family: 'Noto Serif TC', query: 'Noto+Serif+TC:wght@700' },
  { family: 'Noto Sans TC', query: 'Noto+Sans+TC:wght@400;700' },
  { family: 'DM Mono', query: 'DM+Mono:wght@400' },
  { family: 'Cormorant Garamond', query: 'Cormorant+Garamond:ital,wght@1,500' },
];

/** 事先裁好的品牌卡字型（commit 在 repo 裡） */
function bundledFonts(): string[] {
  const dir = join(process.cwd(), 'src', 'assets', 'og-fonts');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ttf'))
    .map((f) => join(dir, f));
}

/** 向 Google Fonts 要只含 text 這些字的子集（不帶瀏覽器 UA 時回傳 TrueType，resvg 讀得懂） */
async function googleFonts(text: string): Promise<string[] | null> {
  const chars = Array.from(new Set(Array.from(text))).filter((c) => c.trim()).join('');
  try {
    const dir = mkdtempSync(join(tmpdir(), 'lanan-og-'));
    const out: string[] = [];
    for (const f of FAMILIES) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const css = await (
          await fetch(`https://fonts.googleapis.com/css2?family=${f.query}&text=${encodeURIComponent(chars)}`, { signal: ctrl.signal })
        ).text();
        const urls = Array.from(css.matchAll(/url\((https:[^)]+)\)\s*format\('truetype'\)/g), (m) => m[1]);
        if (!urls.length) throw new Error(`沒有 ${f.family} 的 truetype 子集`);
        for (const u of urls) {
          const res = await fetch(u, { signal: ctrl.signal });
          if (!res.ok) throw new Error(`${f.family} 字型下載失敗 ${res.status}`);
          const file = join(dir, `${out.length}.ttf`);
          writeFileSync(file, Buffer.from(await res.arrayBuffer()));
          out.push(file);
        }
      } finally {
        clearTimeout(timer);
      }
    }
    return out;
  } catch (err) {
    console.warn('[og] 抓不到分享圖字型，豆子分享圖改用品牌卡：', (err as Error).message);
    return null;
  }
}

async function toPng(svg: string, fonts: string[]): Promise<Uint8Array> {
  const { Resvg } = await import('@resvg/resvg-js');
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_W },
    // 不載入系統字型：缺字就是缺字，不會偷偷換成本機字型而在 CI 上變豆腐
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Noto Sans TC' },
  });
  return new Uint8Array(r.render().asPng());
}

/* ───────── 共用圖形 ───────── */
/** 把 bag.ts 的 SVG 改成可以內嵌的 <svg x y width height>（保留 viewBox，自動等比縮放） */
function nestBag(bagSvg: string, x: number, y: number, w: number): string {
  const h = (w * 320) / 240;
  return bagSvg.replace('<svg class="bag"', `<svg class="bag" x="${x}" y="${y}" width="${w}" height="${h.toFixed(1)}"`);
}

function badge(cx: number, cy: number): string {
  const label = '示範作品・諾豪資訊製作';
  const w = label.length * 17 + 44;
  return `<g>
<rect x="${cx - w / 2}" y="${cy - 19}" width="${w}" height="38" rx="19" fill="${C.ink}"/>
<text class="sans" x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="1" fill="${C.bg}">${label}</text>
</g>`;
}

function wordmark(cx: number, y: number, ink = C.ink, ink2 = C.ink2): string {
  return `<g>
<text class="serif" x="${cx - 8}" y="${y}" text-anchor="end" font-size="34" letter-spacing="3" fill="${ink}">嵐岸</text>
<text class="italic" x="${cx + 8}" y="${y - 2}" font-size="26" fill="${ink2}">Lan’an Roastery</text>
</g>`;
}

const pol = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)] as const;
};

/** 首頁同款刻度盤（HeroArt.astro 的簡化版） */
function dial(cx: number, cy: number, s: number, roast: number): string {
  const ticks = Array.from({ length: 120 }, (_, i) => {
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    const [x1, y1] = pol(cx, cy, 254 * s, i * 3);
    const [x2, y2] = pol(cx, cy, (major ? 232 : mid ? 240 : 246) * s, i * 3);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.ink}" stroke-opacity="${major ? 0.9 : 0.45}" stroke-width="${major ? 1.4 : 1}"/>`;
  }).join('');
  const segs = ROAST.map((color, i) => {
    const st = 222 + i * 56;
    const [x1, y1] = pol(cx, cy, 176 * s, st);
    const [x2, y2] = pol(cx, cy, 176 * s, st + 50);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${176 * s} ${176 * s} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${7 * s}" stroke-linecap="round"/>`;
  }).join('');
  const labs = [
    { t: '淺', deg: 247 },
    { t: '中', deg: 345 },
    { t: '深', deg: 443 },
  ]
    .map((l) => {
      const [x, y] = pol(cx, cy, 156 * s, l.deg);
      return `<text class="serif" x="${x.toFixed(1)}" y="${(y + 8 * s).toFixed(1)}" text-anchor="middle" font-size="${24 * s}" fill="${C.ink}">${l.t}</text>`;
    })
    .join('');
  const needleDeg = 247 + 56 * (Math.min(5, Math.max(1, Math.round(roast))) - 1);
  const [nx, ny] = pol(cx, cy, 205 * s, needleDeg);
  return `<g>
${ticks}
<circle cx="${cx}" cy="${cy}" r="${190 * s}" fill="none" stroke="${C.rule}"/>
${segs}
<circle cx="${cx}" cy="${cy}" r="${138 * s}" fill="rgba(181,86,43,.12)"/>
${labs}
<g transform="translate(${nx.toFixed(1)} ${ny.toFixed(1)}) rotate(${needleDeg})"><path d="M0 -7l-7 -14h14z" transform="translate(0 14)" fill="${C.accent}"/></g>
<g transform="translate(${cx} ${cy}) rotate(28)"><ellipse rx="${62 * s}" ry="${90 * s}" fill="#3B2418"/><path d="M0 ${-86 * s}C${24 * s} ${-40 * s} ${-24 * s} ${40 * s} 0 ${86 * s}" fill="none" stroke="${C.bg}" stroke-width="${7 * s}" stroke-linecap="round"/></g>
</g>`;
}

function frame(inner: string, bg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
<style>${FONT_CSS}</style>
<rect width="${OG_W}" height="${OG_H}" fill="${bg}"/>
${inner}
</svg>`;
}

/** 安全區外的裝飾：上下兩條細線與兩側直排小字（被裁掉也沒關係） */
function sideDecor(ink2: string, rule: string): string {
  const vt = (x: number, t: string) =>
    `<text class="serif" x="${x}" y="315" text-anchor="middle" font-size="17" letter-spacing="9" fill="${ink2}" writing-mode="tb" glyph-orientation-vertical="0">${t}</text>`;
  return `<path d="M60 120H1140M60 528H1140" stroke="${rule}"/>
${vt(150, '大稻埕・小批烘焙')}
${vt(1050, '每週烘豆・作品範例')}`;
}

/* ───────── 品牌卡 ───────── */
export const BRAND_ALT = '嵐岸咖啡示範網站分享卡：山的味道，在岸邊慢慢烘開。示範作品・諾豪資訊製作';

export function brandSvg(): string {
  const bag = renderBag(
    { name: '嵐岸', origin: '台北・大稻埕', process: '小批烘焙', roast: 3, weight: 200, bagColor: C.accent, seriesLabel: 'HOUSE ROAST' },
    'og-brand'
  );
  const title = `<text class="serif" font-size="58" fill="${C.ink}" letter-spacing="2">
<tspan x="612" y="262">山的味道，</tspan>
<tspan x="612" y="340">在岸邊</tspan>
<tspan x="612" y="418"><tspan fill="${C.accentInk}">慢慢</tspan>烘開。</tspan>
</text>`;
  return frame(
    `${sideDecor(C.ink2, C.rule)}
${wordmark(600, 82)}
${dial(445, 318, 0.56, 3)}
${nestBag(bag, 492, 330, 108)}
${title}
${badge(600, 570)}`,
    C.bg
  );
}

export async function brandPng(): Promise<Uint8Array> {
  return toPng(brandSvg(), bundledFonts());
}

/* ───────── 豆子卡 ───────── */
function mix(hex: string, pct: number, base = C.bg): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(base);
  return '#' + a.map((v, i) => Math.round(v * pct + b[i] * (1 - pct)).toString(16).padStart(2, '0')).join('');
}

/** 粗估字寬（em）：中日韓全形 1、其他 0.56 */
function em(s: string): number {
  return Array.from(s).reduce((n, c) => n + (/[⺀-鿿豈-﫿＀-￯　-〿]/.test(c) ? 1 : 0.56), 0);
}

function fit(s: string, maxW: number, maxFs: number, minFs: number): { text: string; fs: number } {
  const w = em(s) || 1;
  const fs = Math.max(minFs, Math.min(maxFs, Math.floor(maxW / w)));
  let text = s;
  while (em(text) * fs > maxW && text.length > 1) text = text.slice(0, -1);
  return { text: text === s ? s : text.slice(0, -1) + '…', fs };
}

export function beanOgAlt(bean: Bean): string {
  return `${displayName(bean.name)}的分享卡：${bean.origin}・${roastLabel(bean.roast)}，${bean.notes.slice(0, 3).join('、')}。嵐岸咖啡示範作品`;
}

export function beanSvg(bean: Bean, data: SiteData): string {
  const s = data.series.find((x) => x.id === bean.series);
  const bagColor = /^#[0-9a-f]{6}$/i.test(bean.bagColor) ? bean.bagColor : C.accent;
  const bg = mix(bagColor, 0.12);
  const ring = mix(bagColor, 0.38);
  const bag = renderBag({ ...bean, seriesLabel: s?.nameEn }, 'og-bean');
  const X = 600; // 文字欄左緣
  const W = 905 - X;
  const name = fit(displayName(bean.name), W, 64, 34);
  const en = fit(bean.nameEn, W, 28, 18);
  const eyebrow = fit([s?.nameEn?.toUpperCase(), s?.name].filter(Boolean).join(' · '), W, 15, 11);
  const origin = fit([bean.origin, bean.region && bean.region !== bean.origin ? bean.region : ''].filter(Boolean).join('・'), W, 22, 16);
  const notes = fit(bean.notes.slice(0, 3).join('・'), W, 22, 16);
  const level = Math.min(5, Math.max(1, Math.round(bean.roast)));
  const bx = (i: number) => X + i * 52;
  const scale = ROAST.map(
    (c, i) =>
      `<rect x="${bx(i)}" y="466" width="46" height="8" rx="4" fill="${c}" ${i === level - 1 ? '' : 'fill-opacity=".35"'}/>`
  ).join('');
  const nameY = 300;
  return frame(
    `<circle cx="430" cy="300" r="205" fill="none" stroke="${ring}"/>
<circle cx="430" cy="300" r="150" fill="none" stroke="${ring}" stroke-dasharray="4 6"/>
${sideDecor(C.ink2, 'rgba(30,22,17,.14)')}
${wordmark(600, 82)}
${nestBag(bag, 330, 160, 200)}
<text class="mono" x="${X}" y="226" font-size="${eyebrow.fs}" letter-spacing="2" fill="${C.accentInk}">${esc(eyebrow.text)}</text>
<text class="serif" x="${X}" y="${nameY}" font-size="${name.fs}" fill="${C.ink}">${esc(name.text)}</text>
${en.text ? `<text class="italic" x="${X}" y="${nameY + 40}" font-size="${en.fs}" fill="${C.ink2}">${esc(en.text)}</text>` : ''}
<path d="M${X} 370H905" stroke="${C.rule}"/>
<text class="sans" x="${X}" y="408" font-size="${origin.fs}" fill="${C.ink}">${esc(origin.text)}</text>
<text class="sans" x="${X}" y="444" font-size="${notes.fs}" fill="${C.ink2}">${esc(notes.text)}</text>
${scale}
<text class="sans" x="${bx(level - 1) + 23}" y="498" text-anchor="middle" font-size="16" font-weight="700" fill="${C.ink}">${roastLabel(level)}</text>
${badge(600, 570)}`,
    bg
  );
}

/* 建置時同一款豆子只算一次：詳細頁（決定 og:image 指向哪裡）與圖檔端點共用結果 */
const beanCache = new Map<string, Promise<Uint8Array | null>>();
let fontsPromise: Promise<string[] | null> | null = null;

function allText(data: SiteData): string {
  const fixed = '嵐岸Lan’an Roastery示範作品・諾豪資訊製作大稻埕小批烘焙每週烘豆作品範例淺中深焙…·· 0123456789GABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const parts = data.beans.flatMap((b) => {
    const s = data.series.find((x) => x.id === b.series);
    return [b.name, b.nameEn, b.origin, b.region, b.process, ...b.notes, s?.name ?? '', s?.nameEn ?? '', (s?.nameEn ?? '').toUpperCase()];
  });
  return fixed + parts.join('');
}

export function beanPng(bean: Bean, data: SiteData): Promise<Uint8Array | null> {
  let p = beanCache.get(bean.slug);
  if (!p) {
    p = (async () => {
      fontsPromise ??= googleFonts(allText(data));
      const fonts = await fontsPromise;
      if (!fonts) return null;
      try {
        return await toPng(beanSvg(bean, data), fonts);
      } catch (err) {
        console.warn(`[og] ${bean.slug} 分享圖產生失敗，改用品牌卡：`, (err as Error).message);
        return null;
      }
    })();
    beanCache.set(bean.slug, p);
  }
  return p;
}
