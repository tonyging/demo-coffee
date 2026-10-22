// 把 src/data/seed.json 匯入 Sanity（可重複執行：用固定 _id，會覆蓋同一筆，不會重複新增）
// 備註：種子資料不含圖片；產品與消息的 image 欄位請在 Studio 後台上傳（選填）。
// 用法：
//   1. 複製 .env.example 成 .env，填入 SANITY_WRITE_TOKEN（Editor 權限）
//   2. npm run import-seed
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error('缺少 PUBLIC_SANITY_PROJECT_ID 或 SANITY_WRITE_TOKEN，請先設定 .env（見 .env.example）。');
  process.exit(1);
}
const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false });
const seed = JSON.parse(readFileSync(new URL('../src/data/seed.json', import.meta.url), 'utf8'));

const block = (text, i) => ({
  _type: 'block',
  _key: `b${i}`,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `s${i}`, text, marks: [] }],
});
const sid = (id) => `series-${id}`;

const docs = [
  { _id: 'storeInfo', _type: 'storeInfo', ...Object.fromEntries(Object.entries(seed.store).filter(([k]) => k !== 'name' && k !== 'nameEn')), hours: seed.store.hours.map((h, i) => ({ _key: `h${i}`, ...h })) },
  ...seed.series.map((s) => ({ _id: sid(s.id), _type: 'series', name: s.name, nameEn: s.nameEn, intro: s.intro, order: s.order })),
  ...seed.beans.map((b) => ({
    _id: `bean-${b.id}`,
    _type: 'bean',
    name: b.name,
    nameEn: b.nameEn,
    slug: { _type: 'slug', current: b.slug },
    series: { _type: 'reference', _ref: sid(b.series) },
    tagline: b.tagline,
    description: b.description,
    origin: b.origin,
    region: b.region,
    altitude: b.altitude,
    process: b.process,
    variety: b.variety,
    roast: b.roast,
    notes: b.notes,
    brew: b.brew,
    acidity: b.scores.acidity,
    sweetness: b.scores.sweetness,
    body: b.scores.body,
    price: b.price,
    weight: b.weight,
    bagColor: b.bagColor,
    featured: b.featured,
  })),
  ...seed.news.map((n) => ({
    _id: `news-${n.id}`,
    _type: 'news',
    title: n.title,
    slug: { _type: 'slug', current: n.slug },
    category: n.category,
    date: n.date,
    excerpt: n.excerpt,
    body: n.body.map(block),
  })),
];

let tx = client.transaction();
for (const d of docs) tx = tx.createOrReplace(d);
const res = await tx.commit();
console.log(`已匯入 ${res.results.length} 份文件到 ${projectId}/${dataset}。`);
