export interface HoursRow {
  days: string;
  open: string;
  close: string;
  weekdays: number[];
  note?: string;
}

export interface Store {
  name: string;
  nameEn: string;
  tagline: string;
  address: string;
  addressNote: string;
  phone: string;
  email: string;
  mapQuery: string;
  hours: HoursRow[];
}

export interface Series {
  id: string;
  order: number;
  name: string;
  nameEn: string;
  intro: string;
}

export interface Photo {
  url: string;
  alt: string;
}

export interface Bean {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  series: string;
  origin: string;
  region: string;
  altitude: string;
  process: string;
  variety: string;
  roast: number;
  notes: string[];
  tagline: string;
  description: string;
  brew: string;
  scores: { acidity: number; sweetness: number; body: number };
  price: number;
  weight: number;
  bagColor: string;
  featured: boolean;
  image?: Photo;
}

export type NewsCategory = '最新消息' | '咖啡知識';

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  category: NewsCategory;
  date: string;
  excerpt: string;
  body: string[];
  image?: Photo;
}

export interface SiteData {
  store: Store;
  series: Series[];
  beans: Bean[];
  news: NewsItem[];
}
