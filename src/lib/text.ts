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

const CJK = '\u3400-\u9fff\uf900-\ufaff';
const CJK_GAP = new RegExp(`([${CJK}])[ \u3000]+(?=[${CJK}])`, 'g');

/**
 * 顯示用品名：品名裡的半形空格只給豆袋換行用（bag.ts 的 splitName），
 * 標題、麵包屑、卡片、分享圖都用這個版本——只刪「兩個中文字之間」的空格，英數旁邊的空格保留。
 * 例：「岸邊 配方」→「岸邊配方」；「肯亞 AA 水洗」維持原樣。
 */
export function displayName(name: unknown): string {
  return String(name ?? '').trim().replace(CJK_GAP, '$1');
}
