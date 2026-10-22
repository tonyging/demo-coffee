import seed from '../data/seed.json';
import { normalize } from './format';
import { GROQ_ALL } from './queries';
import type { SiteData } from './types';

const seedData = seed as unknown as SiteData;

export const SANITY_PROJECT_ID = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string | undefined;
export const SANITY_DATASET = (import.meta.env.PUBLIC_SANITY_DATASET as string | undefined) || 'production';

let cache: Promise<SiteData> | null = null;

/** 有 Sanity 專案 ID → 建置時抓；沒有 → 用種子資料。 */
export function getData(): Promise<SiteData> {
  cache ??= (async () => {
    if (!SANITY_PROJECT_ID) return normalize(null, seedData);
    try {
      const { createClient } = await import('@sanity/client');
      const client = createClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: '2025-01-01',
        useCdn: false,
      });
      const raw = await client.fetch(GROQ_ALL);
      return normalize(raw, seedData);
    } catch (err) {
      console.warn('[data] Sanity 抓取失敗，改用種子資料：', (err as Error).message);
      return normalize(null, seedData);
    }
  })();
  return cache;
}

export function seedSnapshot(): SiteData {
  return normalize(null, seedData);
}
