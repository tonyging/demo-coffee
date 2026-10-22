import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { zhHantLocale } from '@sanity/locale-zh-hant';
import { schemaTypes } from './schemaTypes';
import { structure, defaultDocumentNode } from './components/structure';

// 「門市資訊」只有一份，做成固定項目，不讓使用者新增多份
const SINGLETON = 'storeInfo';

export default defineConfig({
  name: 'default',
  title: '嵐岸咖啡 內容後台',
  projectId: 'nxbcmng6',
  dataset: 'production',
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    visionTool(),
    zhHantLocale(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => schemaType !== SINGLETON),
      {
        id: 'bean-in-series',
        title: '咖啡豆（指定系列）',
        schemaType: 'bean',
        parameters: [{ name: 'seriesId', type: 'string' }],
        value: ({ seriesId }: { seriesId: string }) => ({ series: { _type: 'reference', _ref: seriesId } }),
      },
    ],
  },
  document: {
    actions: (prev, { schemaType }) =>
      schemaType === SINGLETON ? prev.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : prev,
  },
});
