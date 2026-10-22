import { defineArrayMember, defineField, defineType } from 'sanity';

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;

/**
 * 開門、打烊時間必填且格式為 HH:MM；只有「公休」的時段（有備註、兩個時間都留空）可以不填。
 * 開門和打烊要同時有或同時沒有。
 */
const timeRule =
  (which: 'open' | 'close') =>
  (value: unknown, context: { parent?: unknown }) => {
    const parent = (context.parent ?? {}) as { open?: string; close?: string; note?: string };
    const v = typeof value === 'string' ? value.trim() : '';
    const other = (which === 'open' ? parent.close : parent.open)?.trim?.() ?? '';
    if (!v) {
      if (other) return which === 'open' ? '有填打烊時間，開門時間也要填' : '有填開門時間，打烊時間也要填';
      if (!parent.note?.trim()) return '請填時間（HH:MM），公休請在備註寫「公休」';
      return true;
    }
    return TIME.test(v) ? true : '格式要是 HH:MM，例如 10:00';
  };

export const storeInfo = defineType({
  name: 'storeInfo',
  title: '門市資訊',
  type: 'document',
  fields: [
    defineField({ name: 'tagline', title: '品牌一句話', type: 'string', description: '顯示在網站每一頁的頁尾。清空的話，頁尾那一行就不顯示。' }),
    defineField({ name: 'address', title: '地址', type: 'string', description: '顯示在首頁、聯絡頁與頁尾。清空的話，網站上的地址就不顯示。' }),
    defineField({ name: 'addressNote', title: '地址備註', type: 'string', description: '顯示在聯絡頁地圖下方，例如：地圖僅為示意。清空就不顯示。' }),
    defineField({ name: 'mapQuery', title: '地圖搜尋關鍵字', type: 'string', description: '用來在聯絡頁顯示 Google 地圖，填路名或店名即可。清空的話，聯絡頁就不顯示地圖。' }),
    defineField({ name: 'phone', title: '電話', type: 'string', description: '顯示在首頁、聯絡頁與頁尾。清空就不顯示。' }),
    defineField({ name: 'email', title: 'Email', type: 'string', description: '顯示在聯絡頁。清空就不顯示。' }),
    defineField({
      name: 'hours',
      title: '營業時間',
      description: '顯示在首頁與聯絡頁，也用來判斷「營業中／已打烊」。每個時段都要填「適用星期」；公休的日子請填備註並把開門、打烊時間留空。',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          title: '時段',
          fields: [
            defineField({ name: 'days', title: '星期（顯示文字）', type: 'string', description: '例如：週二至週五', validation: (r) => r.required() }),
            defineField({
              name: 'open',
              title: '開門時間',
              type: 'string',
              description: '24 小時制，格式 HH:MM，例如 10:00。公休請留空並填下方備註。',
              validation: (r) => r.custom(timeRule('open')),
            }),
            defineField({
              name: 'close',
              title: '打烊時間',
              type: 'string',
              description: '24 小時制，格式 HH:MM，例如 18:00。',
              validation: (r) => r.custom(timeRule('close')),
            }),
            defineField({
              name: 'weekdays',
              title: '適用星期',
              type: 'array',
              of: [{ type: 'number' }],
              description: '用來判斷「現在是否營業中」，至少選一天。',
              validation: (r) => r.required().min(1).error('請至少選一個適用星期'),
              options: {
                list: [
                  { title: '週日', value: 0 },
                  { title: '週一', value: 1 },
                  { title: '週二', value: 2 },
                  { title: '週三', value: 3 },
                  { title: '週四', value: 4 },
                  { title: '週五', value: 5 },
                  { title: '週六', value: 6 },
                ],
              },
            }),
            defineField({ name: 'note', title: '備註', type: 'string', description: '例如：公休（烘豆日）' }),
          ],
          preview: { select: { title: 'days', subtitle: 'open' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: '門市資訊' }) },
});
