import type { Bean, HoursRow, NewsItem, Photo, Series, SiteData, Store } from './types';

import { ROAST_LABELS, displayName, esc, roastLabel } from './text';
export { ROAST_LABELS, displayName, esc, roastLabel };

export function formatPrice(n: number): string {
  return 'NT$ ' + Number(n).toLocaleString('en-US');
}

export function formatDate(iso: string): string {
  return iso.replaceAll('-', '.');
}

/** 站內連結：自動補上 base（/demo-coffee/） */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + '/' + path.replace(/^\//, '');
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 營業時間防呆：weekdays 可能是 null／空陣列，open／close 可能缺值或格式不對；整理成安全形狀，無法使用的列直接略過 */
export function cleanHours(hours: any): HoursRow[] {
  if (!Array.isArray(hours)) return [];
  const timeOk = (v: any) => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v.trim());
  const rows: HoursRow[] = [];
  for (const h of hours) {
    if (!h || typeof h !== 'object') continue;
    const days = typeof h.days === 'string' ? h.days.trim() : '';
    const weekdays = Array.isArray(h.weekdays) ? h.weekdays.map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
    if (!days && !weekdays.length) continue;
    const both = timeOk(h.open) && timeOk(h.close);
    const note = typeof h.note === 'string' && h.note.trim() ? h.note.trim() : undefined;
    rows.push({ days, weekdays, open: both ? h.open.trim() : '', close: both ? h.close.trim() : '', ...(note ? { note } : {}) });
  }
  return rows;
}

/** 將資料整理成安全、完整的形狀（Sanity 來的資料可能缺欄位） */
export function normalize(raw: any, fallback: SiteData): SiteData {
  const num = (v: any, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const photo = (o: any): Photo | undefined => {
    const u = o?.imageUrl ?? o?.image?.url;
    if (typeof u !== 'string' || !/^https:\/\//.test(u)) return undefined;
    return { url: u + (u.includes('?') ? '' : '?w=900&auto=format'), alt: o?.imageAlt ?? o?.image?.alt ?? '' };
  };
  const paragraphs = (b: any): string[] =>
    Array.isArray(b)
      ? b.map((x) => (typeof x === 'string' ? x : x?.text ?? '')).filter(Boolean)
      : [];

  const series: Series[] = (raw?.series?.length ? raw.series : fallback.series).map(
    (s: any, i: number) => ({
      id: s.id ?? s._id ?? String(i),
      order: num(s.order, i + 1),
      name: s.name ?? '',
      nameEn: s.nameEn ?? '',
      intro: s.intro ?? '',
    })
  );
  series.sort((a, b) => a.order - b.order);

  const beans: Bean[] = (raw?.beans?.length ? raw.beans : fallback.beans).map((b: any) => ({
    id: b.id ?? b._id ?? b.slug,
    slug: b.slug,
    name: b.name ?? '',
    nameEn: b.nameEn ?? '',
    series: b.series ?? '',
    origin: b.origin ?? '',
    region: b.region ?? '',
    altitude: b.altitude ?? '—',
    process: b.process ?? '',
    variety: b.variety ?? '',
    roast: clamp(num(b.roast, 3), 1, 5),
    notes: Array.isArray(b.notes) ? b.notes : [],
    tagline: b.tagline ?? '',
    description: b.description ?? '',
    brew: b.brew ?? '',
    scores: {
      acidity: clamp(num(b.scores?.acidity, 3), 1, 5),
      sweetness: clamp(num(b.scores?.sweetness, 3), 1, 5),
      body: clamp(num(b.scores?.body, 3), 1, 5),
    },
    price: num(b.price, 0),
    weight: num(b.weight, 200),
    bagColor: /^#[0-9a-f]{6}$/i.test(b.bagColor ?? '') ? b.bagColor : '#B5562B',
    featured: !!b.featured,
    image: photo(b),
  }));

  const news: NewsItem[] = (raw?.news?.length ? raw.news : fallback.news)
    .map((n: any) => ({
      id: n.id ?? n._id ?? n.slug,
      slug: n.slug,
      title: n.title ?? '',
      category: n.category === '咖啡知識' ? '咖啡知識' : '店內消息', // 舊資料的「最新消息」一律視為「店內消息」
      date: String(n.date ?? '').slice(0, 10),
      excerpt: n.excerpt ?? '',
      body: paragraphs(n.body),
      image: photo(n),
    }))
    .sort((a: NewsItem, b: NewsItem) => (a.date < b.date ? 1 : -1));

  // 後台有門市文件就以後台為準（欄位清空 = 網站該列隱藏）；整份文件不存在才用種子資料
  const rs = raw?.store;
  const str = (v: any) => (typeof v === 'string' ? v.trim() : '');
  const store: Store = rs && typeof rs === 'object'
    ? {
        name: str(rs.name),
        nameEn: str(rs.nameEn),
        tagline: str(rs.tagline),
        address: str(rs.address),
        addressNote: str(rs.addressNote),
        phone: str(rs.phone),
        email: str(rs.email),
        mapQuery: str(rs.mapQuery),
        hours: cleanHours(rs.hours),
      }
    : { ...fallback.store, hours: cleanHours(fallback.store.hours) };

  return { store, series, beans, news };
}

/** 簡易雜湊：建置時與瀏覽器用同一支，比對「畫面有沒有變」 */
export function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
