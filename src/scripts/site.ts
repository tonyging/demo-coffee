const root = document.documentElement;

/* 深淺色切換 */
document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const current =
    root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('lanan-theme', next);
  } catch {}
});

/* 手機選單 */
const nav = document.getElementById('nav');
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const themeBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const isOpen = () => !!nav?.classList.contains('is-open');
const mq = matchMedia('(max-width: 899px)');
const openIcon = '<path d="M4 8h16M4 16h16" />';
const closeIcon = '<path d="M5 5l14 14M19 5L5 19" />';
let savedY = 0;
function setMenu(open: boolean, returnFocus = false) {
  if (!nav || !menuBtn) return;
  const wasOpen = isOpen();
  if (open && !wasOpen) savedY = window.scrollY;
  const header = document.querySelector('.site-header') as HTMLElement;
  nav.style.setProperty('--header-h', header.getBoundingClientRect().bottom + 'px');
  nav.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  menuBtn.querySelector('svg')!.innerHTML = open ? closeIcon : openIcon;
  /* 鎖 html 的捲動（不動 body），關閉時把捲動位置還原，避免跳回頁首 */
  root.style.overflow = open ? 'hidden' : '';
  if (!open && wasOpen) window.scrollTo({ top: savedY, behavior: 'instant' });
  /* 開啟時把焦點移進第一個連結；關閉時（Esc、點外面）還給選單鈕 */
  if (open) setTimeout(() => nav.querySelector<HTMLElement>('a')?.focus({ preventScroll: true }), 60);
  else if (returnFocus) menuBtn.focus({ preventScroll: true });
}
menuBtn?.addEventListener('click', () => setMenu(!isOpen()));
nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (e) => {
  if (!isOpen()) return;
  const t = e.target as Node;
  if (nav?.contains(t) || menuBtn?.contains(t) || themeBtn?.contains(t)) return;
  setMenu(false, true);
});
addEventListener('keydown', (e) => {
  if (!isOpen() || !mq.matches) return;
  if (e.key === 'Escape') {
    setMenu(false, true);
    return;
  }
  if (e.key === 'Tab') {
    /* 焦點只在選單面板、主題鈕與選單鈕之間循環 */
    const items = [...(nav?.querySelectorAll<HTMLElement>('a') ?? []), themeBtn, menuBtn].filter(Boolean) as HTMLElement[];
    const first = items[0];
    const last = items[items.length - 1];
    const cur = document.activeElement as HTMLElement | null;
    if (e.shiftKey && cur === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && cur === last) {
      e.preventDefault();
      first.focus();
    } else if (!cur || !items.includes(cur)) {
      e.preventDefault();
      first.focus();
    }
  }
});
matchMedia('(min-width: 900px)').addEventListener('change', (e) => e.matches && setMenu(false));

/* 捲動進場 */
const io =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('is-in');
              io?.unobserve(en.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      )
    : null;
function observe(scope: ParentNode = document) {
  scope.querySelectorAll('.reveal:not(.is-in)').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
}
observe();
addEventListener('live:updated', () => observe());

/* 門市營業狀態（台北時間） */
function openStatus() {
  const el = document.querySelector<HTMLElement>('[data-open-status]');
  if (!el) return;
  let hours: { weekdays: number[]; open: string; close: string }[] = [];
  try {
    hours = JSON.parse(el.dataset.hours || '[]');
  } catch {}
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const dayIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const mins = (parseInt(get('hour')) % 24) * 60 + parseInt(get('minute'));
  const timeOk = (s: unknown): s is string => typeof s === 'string' && /^\d{1,2}:\d{2}$/.test(s.trim());
  const today = (Array.isArray(hours) ? hours : []).find((h) => h && Array.isArray(h.weekdays) && h.weekdays.includes(dayIdx));
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  let text = '今日公休';
  let isOpen = 'no';
  if (today && timeOk(today.open) && timeOk(today.close)) {
    if (mins >= toMin(today.open) && mins < toMin(today.close)) {
      text = `營業中・營業至 ${today.close}`;
      isOpen = 'yes';
    } else if (mins < toMin(today.open)) {
      text = `尚未營業・${today.open} 開門`;
    } else {
      text = '今日已打烊';
    }
  }
  el.textContent = text;
  el.dataset.open = isOpen;
  document.querySelectorAll('[data-hours-row]').forEach((r) => {
    const days = (r as HTMLElement).dataset.hoursRow!.split(',').map(Number);
    r.classList.toggle('is-today', days.includes(dayIdx));
  });
}
openStatus();
addEventListener('live:updated', openStatus);
