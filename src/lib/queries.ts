/** 共用的 GROQ 查詢（建置時與瀏覽器即時更新共用同一份） */
export const GROQ_ALL = /* groq */ `{
  "series": *[_type == "series"] | order(order asc){ "id": _id, order, name, nameEn, intro },
  "beans": *[_type == "bean"] | order(_createdAt asc){
    "id": _id, "slug": slug.current, name, nameEn, "series": series->_id,
    origin, region, altitude, process, variety, roast, notes, tagline, description, brew,
    "scores": { "acidity": acidity, "sweetness": sweetness, "body": body },
    price, weight, bagColor, featured,
    "imageUrl": image.asset->url, "imageAlt": image.alt
  },
  "news": *[_type == "news"] | order(date desc){
    "id": _id, "slug": slug.current, title, category, "date": date, excerpt, "imageUrl": image.asset->url, "imageAlt": image.alt,
    "body": body[]{ "text": array::join(children[].text, "") }
  },
  "store": *[_type == "storeInfo"][0]{
    name, nameEn, tagline, address, addressNote, phone, email, mapQuery,
    hours[]{ days, open, close, weekdays, note }
  }
}`;

export const SANITY_API_VERSION = '2025-01-01';
