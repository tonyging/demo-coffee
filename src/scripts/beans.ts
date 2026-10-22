/** 咖啡豆列表：依系列、烘焙度、風味篩選（純前端，不重新載入頁面）。風味來自網址 ?flavor=（詳細頁的風味標籤連過來） */
const bar = document.querySelector<HTMLElement>('[data-filters]');
const list = document.querySelector<HTMLElement>('[data-live="beans"]');
const count = document.querySelector<HTMLElement>('[data-count]');
const empty = document.querySelector<HTMLElement>('[data-empty]');
const emptyMsg = document.querySelector<HTMLElement>('[data-empty-msg]');
const flavorWrap = document.querySelector<HTMLElement>('[data-flavor]');
const flavorBtn = document.querySelector<HTMLButtonElement>('[data-flavor-clear]');
const flavorLabel = document.querySelector<HTMLElement>('[data-flavor-label]');

const params = new URLSearchParams(location.search);
const state = { series: 'all', roast: 'all', flavor: (params.get('flavor') ?? '').trim() };

function apply() {
  if (!list) return;
  let shown = 0;
  list.querySelectorAll<HTMLElement>('.series-block').forEach((sec) => {
    const seriesOk = state.series === 'all' || sec.dataset.seriesId === state.series;
    let any = 0;
    sec.querySelectorAll<HTMLElement>('.bean-card').forEach((card) => {
      const notes = (card.dataset.notes ?? '').split('|');
      const ok =
        seriesOk &&
        (state.roast === 'all' || card.dataset.roast === state.roast) &&
        (!state.flavor || notes.includes(state.flavor));
      card.hidden = !ok;
      if (ok) any++;
    });
    sec.hidden = any === 0;
    shown += any;
  });
  if (count) count.textContent = `顯示 ${shown} 款`;
  if (empty) empty.hidden = shown !== 0;
  if (emptyMsg)
    emptyMsg.textContent = state.flavor
      ? `目前沒有帶「${state.flavor}」風味${state.series !== 'all' || state.roast !== 'all' ? '、又符合這個組合' : ''}的豆子。`
      : '這個組合目前沒有豆子。';
  if (flavorWrap) flavorWrap.hidden = !state.flavor;
  if (flavorLabel) flavorLabel.textContent = state.flavor;
  if (flavorBtn) flavorBtn.setAttribute('aria-label', `清除風味篩選：${state.flavor}`);
  bar?.querySelectorAll<HTMLButtonElement>('.chip[data-group]').forEach((c) => {
    const g = c.dataset.group as 'series' | 'roast';
    c.setAttribute('aria-pressed', String(state[g] === c.dataset.value));
  });
}

/** 清除風味：同步把網址上的 ?flavor= 拿掉，重新整理或分享時不會又套回去 */
function clearFlavor() {
  state.flavor = '';
  const u = new URL(location.href);
  u.searchParams.delete('flavor');
  history.replaceState(history.state, '', u.pathname + u.search + u.hash);
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
  const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip[data-group]');
  if (!chip) return;
  state[chip.dataset.group as 'series' | 'roast'] = chip.dataset.value!;
  apply();
});
flavorBtn?.addEventListener('click', () => {
  clearFlavor();
  apply();
  // 按鈕隱藏後把焦點交給「全部」系列鈕，鍵盤使用者不會掉回頁首
  bar?.querySelector<HTMLButtonElement>('.chip[data-group="series"]')?.focus();
});
document.getElementById('reset-filters')?.addEventListener('click', () => {
  state.series = 'all';
  state.roast = 'all';
  clearFlavor();
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
