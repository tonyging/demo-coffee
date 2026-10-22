import { renderBag } from './bag';
import { renderRadar, renderRoastScale } from './charts';
import { displayName, esc, formatDate, formatPrice, roastLabel, url } from './format';
import type { Bean, HoursRow, NewsItem, Series } from './types';

/** 這些函式同時給 Astro（建置時）與瀏覽器（即時更新）使用，確保兩邊畫面一致。 */

/** 跨頁轉場用的 view-transition-name：依 slug 產生合法、唯一的 CSS 識別字（非英數字元轉成 _十六進位） */
export function vtName(slug: string): string {
  return 'bag-' + String(slug).replace(/[^a-zA-Z0-9-]/g, (c) => `_${c.codePointAt(0)!.toString(16)}`);
}

/** 風味標籤連到豆子列表的風味篩選 */
export function flavorHref(note: string): string {
  return `${url('beans/')}?flavor=${encodeURIComponent(note)}`;
}

export function beanCard(b: Bean, s: Series | undefined, idPrefix = 'c'): string {
  const bag = renderBag(
    { ...b, seriesLabel: s?.nameEn },
    `${idPrefix}-${b.slug}`
  );
  return `<article class="bean-card" data-series="${esc(b.series)}" data-roast="${b.roast}" data-notes="${esc(b.notes.join('|'))}" style="--bag:${esc(b.bagColor)};--vt:${vtName(b.slug)}">
<a class="bean-card__link" href="${url(`beans/${b.slug}/`)}">
<div class="bean-card__stage${b.image ? ' has-photo' : ''}">${b.image ? `<img class="photo" src="${esc(b.image.url)}" alt="${esc(b.image.alt || displayName(b.name))}" loading="lazy" decoding="async" />` : bag}</div>
<div class="bean-card__body">
<p class="eyebrow"><span class="bc-series">${esc(s?.nameEn ?? '')}<span aria-hidden="true"> · </span></span><span class="nw">${roastLabel(b.roast)}</span></p>
<h3 class="bean-card__name">${esc(displayName(b.name))}</h3>
<p class="bean-card__notes">${b.notes.map((n) => `<span class="nw">${esc(n)}</span>`).join(' ')}</p>
<p class="bean-card__price"><span class="num">${formatPrice(b.price)}</span><span class="unit"> / ${b.weight} g</span></p>
</div>
</a>
</article>`;
}

export function newsRow(n: NewsItem, opts: { link?: boolean } = {}): string {
  const link = opts.link !== false;
  const open = link ? `<a class="news-row__link" href="${url(`news/${n.slug}/`)}">` : `<div class="news-row__link">`;
  const close = link ? '</a>' : '</div>';
  const arrow = link ? '<span class="news-row__arrow" aria-hidden="true">→</span>\n' : '';
  return `<li class="news-row">
${open}
<time class="news-row__date mono" datetime="${esc(n.date)}">${formatDate(n.date)}</time>
<span class="tag${n.category === '咖啡知識' ? ' tag--know' : ''}">${esc(n.category)}</span>
<span class="news-row__title">${esc(n.title)}</span>
${arrow}${close}
</li>`;
}

import type { SiteData } from './types';
import { hash } from './format';

const seriesMap = (d: SiteData) => new Map(d.series.map((s) => [s.id, s]));

export function featuredHtml(d: SiteData): string {
  const m = seriesMap(d);
  return d.beans
    .filter((b) => b.featured)
    .slice(0, 3)
    .map((b, i) => `<div class="reveal" style="--d:${i * 0.1}s">${beanCard(b, m.get(b.series), 'f')}</div>`)
    .join('');
}

export function news3Html(d: SiteData): string {
  return `<ul class="news-list">${d.news.slice(0, 3).map(newsRow).join('')}</ul>`;
}

export function newsListHtml(d: SiteData): string {
  return `<ul class="news-list">${d.news.map(newsRow).join('')}</ul>`;
}

export function beanSectionsHtml(d: SiteData): string {
  const m = seriesMap(d);
  return d.series
    .map((s) => {
      const items = d.beans.filter((b) => b.series === s.id);
      if (!items.length) return '';
      return `<section class="series-block" id="series-${esc(s.id)}" data-series-id="${esc(s.id)}" data-series-name="${esc(s.name)}" aria-labelledby="h-${esc(s.id)}">
<div class="series-head"><div><span class="en">${esc(s.nameEn)}</span><h2 id="h-${esc(s.id)}">${esc(s.name)}</h2></div><p class="lede">${esc(s.intro)}</p></div>
<div class="bean-grid">${items.map((b) => beanCard(b, m.get(b.series), 'l')).join('')}</div>
</section>`;
    })
    .join('');
}

export const sig = (html: string) => hash(html);

/** 豆子詳細頁內容（Astro 靜態頁與 404 頁的動態渲染共用，確保樣式一致） */
export function beanDetailHtml(bean: Bean, data: SiteData): string {
  const series = data.series.find((s) => s.id === bean.series);
  const bag = renderBag({ ...bean, seriesLabel: series?.nameEn }, 'detail');
  const radar = renderRadar({ ...bean.scores, roast: bean.roast });
  const scale = renderRoastScale(bean.roast);
  const related = data.beans.filter((b) => b.series === bean.series && b.id !== bean.id).slice(0, 3);
  const facts = [
    ['產地', bean.origin],
    ['產區', bean.region],
    ['海拔', bean.altitude],
    ['處理法', bean.process],
    ['品種', bean.variety],
    ['烘焙度', roastLabel(bean.roast)],
  ];
  return `<div class="wrap">
<nav class="crumbs" aria-label="麵包屑" style="padding-top: 28px; margin-bottom: 0">
<a href="${url('')}">首頁</a><span aria-hidden="true">/</span>
<a href="${url('beans/')}">咖啡豆</a><span aria-hidden="true">/</span>
<a href="${url(`beans/#series-${bean.series}`)}">${esc(series?.name)}</a><span aria-hidden="true">/</span>
<span aria-current="page">${esc(displayName(bean.name))}</span>
</nav>
<div class="detail" style="--bag:${esc(bean.bagColor)};--vt:${vtName(bean.slug)}">
<div class="detail__stage${bean.image ? ' has-photo' : ''}">${bean.image ? `<img class="photo" src="${esc(bean.image.url)}" alt="${esc(bean.image.alt || displayName(bean.name))}" decoding="async" />` : bag}</div>
<div class="detail__info">
<p class="eyebrow">${esc(series?.nameEn)} · ${esc(series?.name)}</p>
<h1>${esc(displayName(bean.name))}</h1>
<p class="detail__en">${esc(bean.nameEn)}</p>
<p class="detail__tagline">${esc(bean.tagline)}</p>
<div class="detail__buy">
<p class="detail__price"><span class="num">${formatPrice(bean.price)}</span> <small>/ ${bean.weight} g</small></p>
<a class="btn" href="${url('contact/')}">洽詢與門市取貨 <span class="arr" aria-hidden="true">→</span></a>
</div>
${bean.notes.length ? `<div class="notes">
<p class="notes__hint" id="notes-hint">風味<span aria-hidden="true">・</span>點一下，找同樣風味的豆子</p>
<ul class="notes-list" aria-labelledby="notes-hint">${bean.notes.map((n) => `<li><a class="note-link" href="${esc(flavorHref(n))}" aria-label="看所有帶「${esc(n)}」風味的豆子">${esc(n)}<span class="note-link__arr" aria-hidden="true">→</span></a></li>`).join('')}</ul>
</div>` : ''}
<div class="charts reveal">
<div><h2>風味評分</h2><div>${radar}</div></div>
<div><h2>烘焙刻度</h2><div>${scale}</div></div>
</div>
<p class="prose-sm">${esc(bean.description)}</p>
<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
${bean.brew ? `<div class="brew"><p class="block-title">沖煮建議</p><p>${esc(bean.brew)}</p></div>` : ''}
<p class="form-note">範例網站不提供線上結帳，實際產品資訊與價格為虛構。</p>
</div>
</div>
${related.length ? `<section class="section--tight" style="padding-bottom: clamp(72px, 10vw, 140px)" aria-labelledby="rel-t">
<div class="sec-head"><div><p class="sec-no mono">同系列</p><h2 class="sec-title" id="rel-t">${esc(series?.name)}的其他豆子</h2></div></div>
<div class="bean-grid">${related.map((b) => beanCard(b, series, 'r')).join('')}</div>
</section>` : ''}
</div>`;
}

/** 消息詳細頁內容 */
export function newsDetailHtml(item: NewsItem, newer?: NewsItem, older?: NewsItem): string {
  const [y, m, d] = item.date.split('-');
  return `<div class="wrap">
<nav class="crumbs" aria-label="麵包屑" style="padding-top: 28px; margin-bottom: 0">
<a href="${url('')}">首頁</a><span aria-hidden="true">/</span>
<a href="${url('news/')}">最新消息</a><span aria-hidden="true">/</span>
<span aria-current="page">${esc(item.title)}</span>
</nav>
<header class="page-head" style="padding-top: clamp(24px, 4vw, 56px)">
<p class="eyebrow mono">${esc(item.category)}</p>
<h1 style="font-size: clamp(2rem, 5vw, 3.8rem); max-width: 18em">${esc(item.title)}</h1>
<p class="lede">${esc(item.excerpt)}</p>
</header>
<div class="article">
<aside class="article__meta">
<time class="mono" datetime="${esc(item.date)}">${formatDate(item.date)}</time>
<span class="tag${item.category === '咖啡知識' ? ' tag--know' : ''}">${esc(item.category)}</span>
</aside>
<div>
${item.image ? `<img class="news-photo" src="${esc(item.image.url)}" alt="${esc(item.image.alt)}" decoding="async" />` : `<div class="news-cover" aria-hidden="true"><div class="news-cover__big"><small>${y} / ${m}</small>${d}</div><span class="mono">Lan’an Roastery</span></div>`}
<div class="prose">${item.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
</div>
</div>
<nav class="next-prev" aria-label="上一則與下一則" style="margin-bottom: clamp(72px, 10vw, 140px)">
${newer ? `<a href="${url(`news/${newer.slug}/`)}"><span class="mono eyebrow">← 較新</span><p class="t">${esc(newer.title)}</p></a>` : '<span></span>'}
${older ? `<a href="${url(`news/${older.slug}/`)}"><span class="mono eyebrow">較舊 →</span><p class="t">${esc(older.title)}</p></a>` : '<span></span>'}
</nav>
</div>`;
}

/** 項目在後台已被刪除時，詳細頁改顯示這段 */
export function removedHtml(kind: 'beans' | 'news'): string {
  const isBean = kind === 'beans';
  return `<div class="page-head" style="border-bottom: 0; min-height: 50vh">
<div class="wrap">
<p class="eyebrow mono">已下架</p>
<h1>${isBean ? '這款已下架' : '這則已下架'}</h1>
<p class="lede" style="margin-bottom: 32px">${isBean ? '這款豆子已從店裡下架，看看目前還有哪些豆子吧。' : '這則消息已經撤下，看看最新的消息吧。'}</p>
<a class="btn" href="${url(isBean ? 'beans/' : 'news/')}">${isBean ? '回到咖啡豆列表' : '回到最新消息'} <span class="arr" aria-hidden="true">→</span></a>
</div>
</div>`;
}

/** 營業時間表的列（建置時與即時更新共用） */
export function hoursRowsHtml(hours: HoursRow[] | null | undefined): string {
  return (Array.isArray(hours) ? hours : [])
    .filter((h) => h && typeof h === 'object' && (h.days || (Array.isArray(h.weekdays) && h.weekdays.length)))
    .map(
      (h) =>
        `<tr data-hours-row="${(Array.isArray(h.weekdays) ? h.weekdays : []).join(',')}"><th scope="row">${esc(h.days ?? '')}</th><td class="num">${esc(h.open ? `${h.open} – ${h.close}` : (h.note ?? '公休'))}</td></tr>`
    )
    .join('');
}

export function mapSrcFor(mapQuery: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=zh-TW&z=16&output=embed`;
}
