import { defineArrayMember, defineField, defineType } from 'sanity';
import { photoField } from './bean';
import { makeAutoSlugInput } from '../components/AutoSlugInput';
import { slugFor } from '../components/slugify';

export const news = defineType({
  name: 'news',
  title: '最新消息',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '標題', type: 'string', validation: (r) => r.required().max(40).error('請輸入標題（最多 40 字）') }),
    defineField({ name: 'slug', title: '網址代稱', type: 'slug', description: '自動產生，不用填。填好標題就會自動帶入，成為這則消息的網址。', components: { input: makeAutoSlugInput('title', 'news') }, options: { source: 'title', maxLength: 60, slugify: slugFor('news') }, validation: (r) => r.required().error('請先填標題，網址代稱會自動產生') }),
    defineField({
      name: 'category',
      title: '分類',
      type: 'string',
      options: { list: [{ title: '最新消息', value: '最新消息' }, { title: '咖啡知識', value: '咖啡知識' }], layout: 'radio' },
      initialValue: '最新消息',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'date', title: '發佈日期', type: 'date', initialValue: () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date()), validation: (r) => r.required() }),
    defineField({ name: 'excerpt', title: '摘要', type: 'string', description: '一句話，顯示在列表與搜尋結果。' }),
    photoField('消息圖片', '選填。有上傳時顯示在內文上方；沒有時顯示日期封面。'),
    defineField({
      name: 'body',
      title: '內文',
      type: 'array',
      of: [defineArrayMember({ type: 'block', styles: [{ title: '一般段落', value: 'normal' }], lists: [], marks: { decorators: [], annotations: [] } })],
    }),
  ],
  orderings: [{ title: '日期（新到舊）', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'date' } },
});
