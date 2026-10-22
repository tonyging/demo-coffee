/** 咖啡豆列表：依系列、烘焙度篩選（純前端，不重新載入頁面） */
const bar = document.querySelector<HTMLElement>('[data-filters]');
const list = document.querySelector<HTMLElement>('[data-live="beans"]');
const count = document.querySelector<HTMLElement>('[data-count]');
const empty = document.querySelector<HTMLElement>('[data-empty]');
const state = { series: 'all', roast: 'all' };

function apply() {
  if (!list) return;
  let shown = 0;
  list.querySelectorAll<HTMLElement>('.series-block').forEach((sec) => {
    const seriesOk = state.series === 'all' || sec.dataset.seriesId === state.series;
    let any = 0;
    sec.querySelectorAll<HTMLElement>('.bean-card').forEach((card) => {
      const ok = seriesOk && (state.roast === 'all' || card.dataset.roast === state.roast);
      card.hidden = !ok;
      if (ok) any++;
    });
    sec.hidden = any === 0;
    shown += any;
  });
  if (count) count.textContent = `顯示 ${shown} 款`;
  if (empty) empty.hidden = shown !== 0;
  bar?.querySelectorAll<HTMLButtonElement>('.chip').forEach((c) => {
    const g = c.dataset.group as 'series' | 'roast';
    c.setAttribute('aria-pressed', String(state[g] === c.dataset.value));
  });
}

function rebuildSeriesChips() {
  const wrap = bar?.querySelector<HTMLElement>('[data-series-chips]');
  if (!wrap || !list) return;
  const all = wrap.querySelector('[data-value="all"]')!;
  wrap.replaceChildren(all);
  list.querySelectorAll<HTMLElement>('.series-block').forEach((sec) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.group = 'series';
    b.dataset.value = sec.dataset.seriesId!;
    b.textContent = sec.dataset.seriesName!;
    wrap.append(b);
  });
  if (!list.querySelector(`[data-series-id="${state.series}"]`)) state.series = 'all';
}

bar?.addEventListener('click', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
  if (!chip) return;
  state[chip.dataset.group as 'series' | 'roast'] = chip.dataset.value!;
  apply();
});
document.getElementById('reset-filters')?.addEventListener('click', () => {
  state.series = 'all';
  state.roast = 'all';
  apply();
});
addEventListener('live:updated', () => {
  rebuildSeriesChips();
  apply();
});

/* 從網址 #series-xxx 進來時，直接套用該系列 */
const m = location.hash.match(/^#series-(.+)$/);
if (m && list?.querySelector(`[data-series-id="${m[1]}"]`)) state.series = m[1];
apply();
