/** 純文字工具（不依賴 Astro / Vite），網站與 Studio 預覽共用 */
export const ROAST_LABELS = ['淺焙', '淺中焙', '中焙', '中深焙', '深焙'] as const;

export function roastLabel(level: number): string {
  const i = Math.min(5, Math.max(1, Math.round(level))) - 1;
  return ROAST_LABELS[i];
}

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
