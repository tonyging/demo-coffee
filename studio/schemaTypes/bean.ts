import { createElement } from 'react';
import { defineField, defineType } from 'sanity';
import { renderBag } from '../../src/lib/bag';
import { BagColorInput } from '../components/BagColorInput';
import { makeAutoSlugInput } from '../components/AutoSlugInput';
import { slugFor } from '../components/slugify';

const BAG_COLORS = [
  { title: '赤陶', value: '#B5562B' },
  { title: '苔綠', value: '#5E6B4A' },
  { title: '霧藍', value: '#5B7385' },
  { title: '焦糖', value: '#A9743A' },
  { title: '墨黑', value: '#2A211B' },
  { title: '酒紅', value: '#7A2E34' },
  { title: '沙灰', value: '#B9AD9A' },
  { title: '暗青', value: '#2F4B4B' },
  { title: '鼠尾草', value: '#8E9A82' },
  { title: '奶茶', value: '#D2B596' },
];

const score = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'number',
    group: 'flavor',
    description,
    options: { list: [1, 2, 3, 4, 5].map((n) => ({ title: `${n} 分`, value: n })), layout: 'radio', direction: 'horizontal' },
    initialValue: 3,
    validation: (r) => r.required().min(1).max(5),
  });


export const photoField = (title: string, description: string, group?: string) =>
  defineField({
    name: 'image',
    title,
    type: 'image',
    description,
    ...(group ? { group } : {}),
    options: { hotspot: true },
    fields: [
      defineField({ name: 'alt', title: '圖片說明（替代文字）', type: 'string', description: '用一句話描述圖片內容，給看不到圖的人與搜尋引擎讀。', validation: (r) => r.max(80) }),
    ],
  });

export const bean = defineType({
  name: 'bean',
  title: '咖啡豆',
  type: 'document',
  groups: [
    { name: 'basic', title: '基本資料', default: true },
    { name: 'flavor', title: '風味與評分' },
    { name: 'sell', title: '價格與袋子' },
  ],
  fields: [
    defineField({ name: 'name', title: '豆子名稱', type: 'string', group: 'basic', description: '會印在袋子標籤上。建議 4–8 個字，中間可用空格分成兩行，例如「耶加雪菲 水洗」。', validation: (r) => r.required().max(16).error('請輸入名稱（最多 16 字）') }),
    defineField({ name: 'nameEn', title: '英文名稱', type: 'string', group: 'basic' }),
    defineField({ name: 'slug', title: '網址代稱', type: 'slug', group: 'basic', description: '自動產生，不用填。填好豆子名稱就會自動帶入，成為這款豆子的網址。', components: { input: makeAutoSlugInput('name', 'bean') }, options: { source: 'name', maxLength: 60, slugify: slugFor('bean') }, validation: (r) => r.required().error('請先填豆子名稱，網址代稱會自動產生') }),
    defineField({ name: 'series', title: '所屬系列', type: 'reference', to: [{ type: 'series' }], group: 'basic', validation: (r) => r.required().error('請選擇系列') }),
    photoField('產品照片', '選填。有上傳照片時，網站顯示照片；沒有時顯示依資料畫出的咖啡豆袋。', 'basic'),
    defineField({ name: 'tagline', title: '一句話介紹', type: 'string', group: 'basic', description: '例如：像春天早上的一杯清茶。' }),
    defineField({ name: 'description', title: '詳細說明', type: 'text', rows: 4, group: 'basic' }),
    defineField({ name: 'origin', title: '產地（國家）', type: 'string', group: 'basic', description: '會印在袋子上。', validation: (r) => r.required() }),
    defineField({ name: 'region', title: '產區', type: 'string', group: 'basic' }),
    defineField({ name: 'altitude', title: '海拔', type: 'string', group: 'basic', description: '例如：1,900–2,100 公尺' }),
    defineField({ name: 'process', title: '處理法', type: 'string', group: 'basic', description: '例如：水洗、日曬、蜜處理' }),
    defineField({ name: 'variety', title: '品種', type: 'string', group: 'basic' }),

    defineField({
      name: 'roast',
      title: '烘焙度',
      type: 'number',
      group: 'flavor',
      options: {
        list: [
          { title: '淺焙', value: 1 },
          { title: '淺中焙', value: 2 },
          { title: '中焙', value: 3 },
          { title: '中深焙', value: 4 },
          { title: '深焙', value: 5 },
        ],
        layout: 'radio',
      },
      initialValue: 3,
      validation: (r) => r.required(),
    }),
    defineField({ name: 'notes', title: '風味關鍵字', type: 'array', of: [{ type: 'string' }], group: 'flavor', description: '3 個左右最剛好，例如：茉莉花、檸檬皮、蜜桃。', options: { layout: 'tags' } }),
    score('acidity', '酸度', '1 = 幾乎無酸，5 = 明亮鮮明'),
    score('sweetness', '甜度', '1 = 不明顯，5 = 非常甜潤'),
    score('body', '醇厚度', '1 = 輕盈，5 = 厚實'),
    defineField({ name: 'brew', title: '沖煮建議', type: 'string', group: 'flavor', description: '例如：手沖 15 g 粉、225 ml 水，92°C，約 2 分 30 秒。' }),

    defineField({ name: 'price', title: '價格（新台幣）', type: 'number', group: 'sell', validation: (r) => r.required().min(0) }),
    defineField({ name: 'weight', title: '容量（公克）', type: 'number', group: 'sell', initialValue: 200 }),
    defineField({
      name: 'bagColor',
      title: '袋子顏色',
      type: 'string',
      group: 'sell',
      description: '網站上的咖啡豆袋會用這個顏色畫出來。',
      components: { input: BagColorInput },
      options: { list: BAG_COLORS, layout: 'radio' },
      initialValue: '#B5562B',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'featured', title: '本季主打（顯示在首頁）', type: 'boolean', group: 'sell', description: '首頁會顯示前 3 款被勾選的豆子。', initialValue: false }),
  ],
  preview: {
    select: { title: 'name', series: 'series.name', price: 'price', color: 'bagColor', origin: 'origin', roast: 'roast', weight: 'weight' },
    prepare: ({ title, series, price, color, origin, roast, weight }) => ({
      title: title || '（未命名）',
      subtitle: `${series || '未選系列'}・NT$ ${Number(price || 0).toLocaleString('en-US')}`,
      media: createElement('div', {
        style: { width: '100%', height: '100%' },
        dangerouslySetInnerHTML: {
          __html: renderBag({ name: title || '', origin: origin || '', roast: roast || 3, weight: weight || 200, bagColor: color || '#B5562B' }, 'lp'),
        },
      }),
    }),
  },
});
