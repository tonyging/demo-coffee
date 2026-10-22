import { defineField, defineType } from 'sanity';

export const series = defineType({
  name: 'series',
  title: '品牌系列',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '系列名稱', type: 'string', description: '例如：山嵐單品', validation: (r) => r.required().error('請輸入系列名稱') }),
    defineField({ name: 'nameEn', title: '英文名稱', type: 'string', description: '顯示在豆袋標籤上，例如：Single Origin' }),
    defineField({ name: 'intro', title: '系列簡介', type: 'text', rows: 3, description: '一到兩句話，顯示在咖啡豆頁面的系列標題旁。' }),
    defineField({ name: 'order', title: '排序', type: 'number', description: '數字越小越前面（1、2、3…）', initialValue: 10 }),
  ],
  orderings: [{ title: '依排序', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'nameEn' } },
});
