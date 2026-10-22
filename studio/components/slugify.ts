/**
 * 網址代稱自動產生。
 * Sanity 預設的 slugify 會把中文全部刪掉（「耶加雪菲」會變成空字串），
 * 所以：英數字部分照用；整個名稱都是中文時，改用「前綴-名稱的雜湊碼」，
 * 同一個名稱永遠得到同一個代稱，且一定是只含 a-z 0-9 - 的網址安全字串。
 */
export function makeSlug(input: string, prefix: string): string {
  const ascii = input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  if (ascii.length >= 3) return ascii;
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  const code = (h >>> 0).toString(36);
  return [prefix, ascii, code].filter(Boolean).join('-').replace(/-+/g, '-');
}

export const slugFor = (prefix: string) => (input: string) => Promise.resolve(makeSlug(input, prefix));
