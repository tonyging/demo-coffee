import type { APIRoute } from 'astro';
import { getData } from '../../../lib/data';
import { beanPng, brandPng } from '../../../lib/og';
import type { Bean, SiteData } from '../../../lib/types';

/** 每款豆子的專屬分享圖（用它自己的豆袋），建置時產生 */
export async function getStaticPaths() {
  const data = await getData();
  return data.beans.map((bean) => ({ params: { slug: bean.slug }, props: { bean, data } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { bean, data } = props as { bean: Bean; data: SiteData };
  // 產生失敗時詳細頁的 og:image 已改指品牌卡；這裡仍回一張可用的圖，避免出現壞連結
  const png = (await beanPng(bean, data)) ?? (await brandPng());
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
