/**
 * 即時更新：GitHub Pages 是純靜態網站，後台改完內容不會自動重建。
 * 這支小腳本在頁面載入後，從 Sanity CDN 重新抓「消息」與「產品」，
 * 畫面有差異就替換——所以店家在後台按下發佈、重新整理網站就會看到。
 * 門市資訊（地址、電話、Email、營業時間與營業狀態）也一併更新：標記為 data-store / data-store-hours / data-store-map 的位置。
 */
import seed from '../data/seed.json';
import { normalize } from '../lib/format';
import { GROQ_ALL, SANITY_API_VERSION } from '../lib/queries';
import { beanDetailHtml, beanSectionsHtml, featuredHtml, hoursRowsHtml, mapSrcFor, news3Html, newsDetailHtml, newsListHtml, removedHtml, sig } from '../lib/render';
import type { SiteData } from '../lib/types';

const meta = document.querySelector<HTMLMetaElement>('meta[name="sanity-live"]')?.content;
const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-live]'));
const storeTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-store],[data-store-hours],[data-store-map],[data-open-status]'));
const detail = document.querySelector<HTMLElement>('[data-live-detail]');

async function run() {
  if (!meta || !(targets.length || storeTargets.length || detail)) return;
  const [projectId, dataset] = meta.split('|');
  const endpoint = `https://${projectId}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(GROQ_ALL)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let raw: any;
  try {
    const res = await fetch(endpoint, { signal: ctrl.signal });
    if (!res.ok) return;
    raw = (await res.json()).result;
  } catch {
    return; // 離線或 CORS 尚未設定：維持建置時的內容
  } finally {
    clearTimeout(timer);
  }
  if (!raw || (!raw.beans?.length && !raw.news?.length && !raw.store)) return; // 後台還沒資料：不要蓋掉種子內容

  const data: SiteData = normalize(raw, seed as unknown as SiteData);
  const builders: Record<string, (d: SiteData) => string> = {
    featured: featuredHtml,
    news3: news3Html,
    news: newsListHtml,
    beans: beanSectionsHtml,
  };
  let changed = false;
  for (const el of targets) {
    const build = builders[el.dataset.live ?? ''];
    if (!build) continue;
    const html = build(data);
    if (sig(html) === el.dataset.sig) continue;
    el.innerHTML = html;
    el.dataset.sig = sig(html);
    changed = true;
  }
  if (applyStore(data)) changed = true;
  if (detail && applyDetail(detail, raw, data)) changed = true;
  if (changed) {
    window.dispatchEvent(new CustomEvent('live:updated', { detail: data }));
    toast('已同步後台最新內容');
  }
}

/** 詳細頁：價格、名稱、描述、風味、圖片等有變就整塊重畫；項目已在後台刪除則顯示「已下架」 */
function applyDetail(el: HTMLElement, raw: any, data: SiteData): boolean {
  const kind = el.dataset.liveDetail;
  const slug = el.dataset.slug;
  if (!slug || (kind !== 'beans' && kind !== 'news')) return false;
  let html = '';
  let title = '';
  if (kind === 'beans') {
    // 後台完全沒有豆子資料時不當成「已刪除」，維持靜態內容
    if (!raw.beans?.length) return false;
    const bean = data.beans.find((b) => b.slug === slug);
    if (bean) {
      html = beanDetailHtml(bean, data);
      title = bean.name;
    }
  } else {
    if (!raw.news?.length) return false;
    const i = data.news.findIndex((n) => n.slug === slug);
    if (i >= 0) {
      html = newsDetailHtml(data.news[i], data.news[i - 1], data.news[i + 1]);
      title = data.news[i].title;
    }
  }
  if (!html) {
    html = removedHtml(kind);
    title = '已下架';
  }
  const s = sig(html);
  if (s === el.dataset.sig) return false;
  el.innerHTML = html;
  el.dataset.sig = s;
  document.title = `${title}｜嵐岸咖啡（作品範例）`;
  return true;
}

/** 門市資訊：地址、電話、Email、地圖、營業時間表；營業狀態由 site.ts 在 live:updated 後重算 */
function applyStore(data: SiteData): boolean {
  const store = data.store as unknown as Record<string, any>;
  let changed = false;
  for (const el of storeTargets) {
    if (el.dataset.store) {
      const v = String(store[el.dataset.store] ?? '');
      // 後台有門市文件就以它為準：欄位清空，網站那一列也跟著隱藏
      const holder = el.closest<HTMLElement>('[data-store-row]') ?? el;
      if (el.textContent !== v) {
        el.textContent = v;
        changed = true;
      }
      if (holder.hidden !== !v) {
        holder.hidden = !v;
        changed = true;
      }
    } else if (el.hasAttribute('data-store-hours')) {
      // 比對「星期＋文字」，忽略 site.ts 加上的 is-today 樣式，避免誤判成有變動
      const probe = document.createElement('tbody');
      probe.innerHTML = hoursRowsHtml(data.store.hours);
      const rows = (t: HTMLElement) => Array.from(t.querySelectorAll('tr'), (r) => `${r.dataset.hoursRow}|${r.textContent}`).join(";");
      if (rows(el) !== rows(probe)) {
        el.innerHTML = probe.innerHTML;
        changed = true;
      }
    } else if (el.hasAttribute('data-store-map')) {
      const src = mapSrcFor(data.store.mapQuery);
      if (data.store.mapQuery && el.getAttribute('src') !== src) {
        el.setAttribute('src', src);
        changed = true;
      }
      if (el.hidden !== !data.store.mapQuery) {
        el.hidden = !data.store.mapQuery;
        changed = true;
      }
    } else if (el.hasAttribute('data-open-status')) {
      const json = JSON.stringify(data.store.hours);
      if (el.dataset.hours !== json) {
        el.dataset.hours = json;
        changed = true;
      }
    }
  }
  return changed;
}

function toast(msg: string) {
  const t = document.createElement('div');
  t.setAttribute('role', 'status');
  t.textContent = msg;
  t.style.cssText =
    'position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;background:var(--panel);color:var(--panel-ink);padding:12px 22px;font-size:.9rem;letter-spacing:.06em;z-index:90;transition:all .5s cubic-bezier(.22,.8,.2,1)';
  document.body.append(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translate(-50%,0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 600);
  }, 3200);
}

run();
