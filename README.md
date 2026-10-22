# 嵐岸咖啡 Lan’an Roastery

虛構品牌「嵐岸咖啡」的形象網站與店家後台，是 [諾豪資訊 Knowhow](https://tonyging.github.io/knowhow/#portfolio) 製作的示範作品。
品牌、人物與內容皆為虛構，不提供真實交易；用意是讓你看到：一間小店的網站可以長什麼樣子，以及店家不寫程式、自己怎麼更新內容。

**線上網址：<https://tonyging.github.io/demo-coffee/>**

想為自己的店做一個類似的網站？歡迎到 [諾豪資訊官網](https://tonyging.github.io/knowhow/) 聊聊。

## 功能重點

- **資料驅動的豆袋與風味圖**：每款豆子的袋子（卡片、詳細頁、首頁主視覺）都是程式依資料即時畫出的 SVG，豆名、產地、烘焙度、袋身顏色全部來自後台欄位。風味雷達與烘焙刻度也由資料生成。在後台改名字或顏色，袋子就跟著變。
- **店家自己改內容**：咖啡豆、品牌系列、最新消息、門市資訊（地址、電話、Email、地圖、營業時間）都在 Sanity 後台編輯，欄位全部繁體中文，有自動存草稿、袋子即時預覽、色票選色、網址代稱自動產生、圖片上傳。
- **即時更新**：網站是純靜態頁面，但瀏覽時會從 Sanity CDN 讀取最新內容。新增、修改、刪除都會在幾秒內反映在列表與詳細頁；刪除的項目會顯示「這款已下架」。抓不到資料時（離線、尚未設定）維持建置時的內容，不會閃爍或清空。
- **營業狀態**：依台北時間與後台設定的營業時間，顯示「營業中」「尚未營業」「今日已打烊」或「今日公休」。
- **發佈後自動建置**：後台發佈時可透過 webhook 觸發 GitHub Actions 重新建置，讓搜尋引擎收錄新頁面。
- **深淺色與無障礙**：預設跟隨系統，可手動切換；文字對比通過 WCAG AA；動效尊重 `prefers-reduced-motion`。
- **後台教學頁**：`/backend-demo/` 以可互動的示意畫面說明三個步驟（登入、新增一款豆子、發一則消息），也說明費用、維運與資安。

### 頁面

| 路徑 | 內容 |
| --- | --- |
| `/` | 首頁：主視覺、本季主打、最新消息、門市資訊與營業狀態 |
| `/about/` | 品牌故事、烘焙曲線示意、烘豆師（虛構） |
| `/beans/`、`/beans/<slug>/` | 咖啡豆列表（可依系列與烘焙度篩選）與詳細頁 |
| `/news/`、`/news/<slug>/` | 最新消息與咖啡知識 |
| `/contact/` | 門市資訊、地圖（示意）、聯絡表單（只做前端驗證，不會送出） |
| `/backend-demo/` | 後台怎麼用 |

## 技術

- 前台：[Astro](https://astro.build/)（靜態輸出）、TypeScript、少量原生 JavaScript
- 後台：[Sanity Studio](https://www.sanity.io/)（`studio/`）
- 部署：GitHub Pages，由 GitHub Actions 建置
- 圖像：全部以 SVG／CSS 自行繪製，沒有圖庫照片

## 本機開發

需要 Node.js 22.12 以上。

```bash
npm install
npm run dev        # http://localhost:4321/demo-coffee/
npm run build      # 輸出到 dist/
npm run preview
```

沒有設定任何環境變數時，網站使用 `src/data/seed.json` 的種子資料建置，所有頁面都完整可用。

```text
src/
  data/seed.json        種子資料
  lib/                  資料讀取與整理、型別、豆袋與圖表 SVG 產生器、共用的版型函式
  layouts/Base.astro    共用骨架（導覽、深淺色、頁尾）
  components/           主視覺、營業時間表
  pages/                所有頁面
  scripts/              site.ts（主題、選單、動效）、live.ts（即時更新）、beans.ts（篩選）
  styles/global.css     色彩 token 與全站樣式
studio/                 Sanity Studio：設定與 schema（bean／series／news／storeInfo）
scripts/                import-seed.mjs（匯入種子資料）
.github/workflows/      deploy.yml
```

## Sanity 設定

1. 到 <https://www.sanity.io/manage> 建立專案與 dataset（`production`，Public），複製 `.env.example` 成 `.env`，填入 `PUBLIC_SANITY_PROJECT_ID` 與 `PUBLIC_SANITY_DATASET`。這兩個值不是金鑰。
2. 匯入種子資料需要寫入權限的 token：在 Sanity 管理頁 → API → Tokens 建立後，**只放在本機 `.env`**（`SANITY_WRITE_TOKEN`），不要提交進版控。接著執行 `npm run import-seed`（可重複執行，用固定 ID 覆蓋）。
3. 在 Sanity 管理頁 → API → CORS origins 加入網站網址（例如 `https://tonyging.github.io`）與本機測試網址 `http://localhost:4321`，不要勾「Allow credentials」。這樣瀏覽器才能即時讀取最新內容。
4. 啟動後台：

   ```bash
   cd studio
   npm install
   npm run dev        # http://localhost:3333
   ```

   第一次需要 `npx sanity login`。要給店家使用時，`npm run deploy` 可部署成 `<名稱>.sanity.studio`，再到 Members 邀請成員。

Sanity 免費方案只有「管理員」與「檢視者」兩種角色，能編輯內容的成員都是管理員；若需要「只能改內容、不能改設定」的細分權限，需升級付費方案。

## 部署

1. 建立 GitHub repo（名稱需與 `astro.config.mjs` 的 `base: '/demo-coffee/'` 對應），到 Settings → Pages，Source 選 **GitHub Actions**。
2. push 到 `main`，`.github/workflows/deploy.yml` 會自動建置並部署。workflow 內已帶入 `PUBLIC_SANITY_PROJECT_ID` 與 `PUBLIC_SANITY_DATASET`；Sanity 還沒有資料時，網站會自動退回種子資料。

### 發佈後自動建置（repository_dispatch）

workflow 支援 `repository_dispatch`，事件名稱為 `sanity-publish`。在 Sanity 設定 webhook 即可在每次發佈後重新建置：

1. 在 GitHub 建立 fine-grained personal access token，Repository access 只選這個 repo，**Contents** 權限設為 Read and write。token 是金鑰，只放在 Sanity webhook 的 header，不要提交。
2. 在 Sanity 管理頁 → API → Webhooks 新增：
   - URL：`https://api.github.com/repos/<帳號>/demo-coffee/dispatches`，Method：`POST`
   - Dataset：`production`；觸發時機：Create、Update、Delete；Filter：`_type in ["bean","news","series","storeInfo"]`；不要勾 Drafts
   - Headers：`Authorization: Bearer <token>`、`Accept: application/vnd.github+json`
   - Projection：`{"event_type":"sanity-publish"}`
3. 在後台發佈一則消息，GitHub → Actions 應該會出現一次由 `repository_dispatch` 觸發的 Deploy。

沒有設定自動建置也能用：即時更新會讓新內容在瀏覽時立即出現，只是搜尋引擎收錄與分享預覽要等下次建置。

## 檢查

```bash
npm run build
npx astro preview --port 4399
npm run qa         # 另開終端機：截圖 375／768／1440 × 淺／深，檢查主控台錯誤、水平捲動、點擊目標
```

## 聲明

網站內容、品牌與人物皆為虛構，與任何真實店家無關。
