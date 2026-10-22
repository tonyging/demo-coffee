import type { APIRoute } from 'astro';
import { brandPng } from '../lib/og';

/** 品牌分享卡（全站預設的 og:image），建置時產生 */
export const GET: APIRoute = async () =>
  new Response(await brandPng(), { headers: { 'Content-Type': 'image/png' } });
