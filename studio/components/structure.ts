import type { DefaultDocumentNodeResolver, StructureResolver } from 'sanity/structure';
import { BagPreview } from './BagPreview';

const SINGLETON = 'storeInfo';
const beanSort = [{ field: 'name', direction: 'asc' as const }];

/** 側欄：咖啡豆（依品牌系列 → 該系列的豆子）、全部豆子、系列設定、最新消息、門市資訊 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('網站內容')
    .items([
      S.listItem()
        .title('咖啡豆・依系列')
        .schemaType('series')
        .child(
          S.documentTypeList('series')
            .title('選擇品牌系列')
            .defaultOrdering([{ field: 'order', direction: 'asc' }])
            .child((seriesId) => {
              const id = seriesId.replace(/^drafts\./, '');
              return S.documentList()
                .title('這個系列的豆子')
                .schemaType('bean')
                .filter('_type == "bean" && series._ref == $id')
                .params({ id })
                .defaultOrdering(beanSort)
                .initialValueTemplates([S.initialValueTemplateItem('bean-in-series', { seriesId: id })]);
            })
        ),
      S.documentTypeListItem('bean').title('全部豆子'),
      S.documentTypeListItem('series').title('系列設定'),
      S.divider(),
      S.documentTypeListItem('news').title('最新消息'),
      S.listItem()
        .title('門市資訊')
        .id(SINGLETON)
        .child(S.document().schemaType(SINGLETON).documentId(SINGLETON).title('門市資訊')),
    ]);

/** 豆子文件多一個「袋子預覽」分頁 */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) =>
  schemaType === 'bean'
    ? S.document().views([S.view.form().title('編輯'), S.view.component(BagPreview).title('袋子預覽')])
    : S.document().views([S.view.form()]);
