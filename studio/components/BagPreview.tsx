import { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import type { UserViewComponent } from 'sanity/structure';
import { renderBag } from '../../src/lib/bag';
import { roastLabel } from '../../src/lib/text';

/**
 * 「袋子預覽」檢視：用網站同一支 renderBag() 畫袋子。
 * document.displayed 會隨編輯中的欄位即時更新（不必先發佈）。
 */
const FONT_CSS = `
.bp .bag{width:100%;height:auto;display:block}
.bp .bag-name{font-family:"Noto Serif TC","Songti TC",serif;font-weight:700}
.bp .bag-mono{font-family:ui-monospace,Menlo,Consolas,monospace}
.bp .bag-sans{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}
`;

export const BagPreview: UserViewComponent = ({ document }) => {
  const d = (document.displayed ?? {}) as Record<string, any>;
  const client = useClient({ apiVersion: '2025-01-01' });
  const seriesRef: string | undefined = d.series?._ref;
  const [series, setSeries] = useState<{ name?: string; nameEn?: string } | null>(null);
  useEffect(() => {
    let alive = true;
    if (!seriesRef) {
      setSeries(null);
      return;
    }
    client
      .fetch('*[_id == $id][0]{name, nameEn}', { id: seriesRef })
      .then((r) => alive && setSeries(r))
      .catch(() => alive && setSeries(null));
    return () => {
      alive = false;
    };
  }, [client, seriesRef]);

  const roast = Number(d.roast) || 3;
  const svg = renderBag(
    {
      name: d.name || '（尚未輸入名稱）',
      origin: d.origin || '產地',
      region: d.region || '',
      process: d.process || '',
      roast,
      weight: Number(d.weight) || 200,
      bagColor: d.bagColor || '#B5562B',
      seriesLabel: series?.nameEn || 'Coffee',
    },
    'studio-preview'
  );
  const notes: string[] = Array.isArray(d.notes) ? d.notes : [];
  return (
    <div className="bp" style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <style>{FONT_CSS}</style>
      <p style={{ margin: '0 0 16px', fontSize: 14, opacity: 0.8 }}>
        網站上的袋子會這樣畫出來。回到「編輯」分頁改名稱、產地、烘焙度或袋子顏色，這裡會立刻跟著變；按「發佈」後，網站才會更新。
      </p>
      <div style={{ width: 260, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, lineHeight: 1.7 }}>
        <div style={{ opacity: 0.7 }}>
          {series?.name || '尚未選擇系列'}・{roastLabel(roast)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          NT$ {Number(d.price || 0).toLocaleString('en-US')} / {Number(d.weight) || 200} g
        </div>
        {notes.length > 0 && <div>{notes.join('　')}</div>}
      </div>
    </div>
  );
};
