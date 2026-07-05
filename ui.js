/* رندر بخش‌های مشترک همه‌ی صفحات: تیکر نرخ طلا، هدر، فوتر، پیام‌های toast */

function renderTicker() {
  const el = document.getElementById('rate-ticker');
  if (!el) return;
  const s = getSettings();
  const rate = formatToman(s.ratePerGram);
  const updated = s.lastRateUpdate
    ? new Date(s.lastRateUpdate).toLocaleString('fa-IR')
    : 'به‌صورت دستی توسط ادمین ثبت شده';

  const items = [
    `نرخ لحظه‌ای هر گرم طلای ۱۸ عیار: <b>${rate}</b><span class="updated">(${updated})</span>`,
    `اجرت و سود بر اساس نوع کالا محاسبه می‌شود`,
    `ارسال به سراسر کشور`,
    `ضمانت اصالت و برگشت کالا`
  ];
  const track = items.map(t => `<span class="rate-ticker__item">${t}</span>`).join('<span class="rate-ticker__item">•</span>');
  el.innerHTML = `<div class="rate-ticker__track">${track}${track}</div>`;
}

function renderCartCount() {
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    const n = cartCount();
    el.textContent = toFaDigits(n);
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

async function trySyncRateFromServer() {
  // اگر سایت روی یک هاست واقعی باشد و Cron Job فایل rate.json را
  // تولید کرده باشد، این تابع آن را می‌خواند و نرخ را خودکار به‌روز می‌کند.
  // اگر فایل وجود نداشته باشد (مثلاً همین الان که در حال تست هستید)،
  // بی‌سروصدا و بدون خطا در کنسول رد می‌شود.
  try {
    const res = await fetch('rate.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.rate) return;
    const settings = getSettings();
    if (data.updatedAt && data.updatedAt !== settings.lastRateUpdate) {
      saveSettings({ ratePerGram: data.rate, lastRateUpdate: data.updatedAt });
      renderTicker();
    }
  } catch (e) {
    // فایل هنوز موجود نیست یا سایت به‌صورت استاتیک باز شده — مشکلی نیست
  }
}

function renderSocialLinks() {
  const s = getSettings();
  const links = [
    { url: s.socialTelegramGroup, label: 'گروه تلگرام', icon: '✈' },
    { url: s.socialTelegram, label: 'ارتباط در تلگرام', icon: '📢' },
    { url: s.socialEitaaGroup, label: 'گروه ایتا', icon: '🗨' },
    { url: s.socialEitaaContact, label: 'ارتباط در ایتا', icon: '💬' },
    { url: s.socialInstagram, label: 'اینستاگرام', icon: '◎' },
    { url: s.socialWhatsapp, label: 'واتس‌اپ', icon: '☎' },
    { url: s.storePhone ? 'tel:' + s.storePhone.replace(/[^0-9+]/g, '') : '', label: 'تماس تلفنی: ' + (s.storePhone || ''), icon: '📞' }
  ].filter(l => l.url);

  const footerEl = document.getElementById('footer-social');
  if (footerEl) {
    footerEl.innerHTML = links.map(l => {
      const isTel = l.url.startsWith('tel:');
      return `<a href="${l.url}" ${isTel ? '' : 'target="_blank" rel="noopener"'}><span>${l.icon}</span> ${l.label}</a>`;
    }).join('');
  }
  const aboutEl = document.getElementById('about-social');
  if (aboutEl) {
    aboutEl.innerHTML = links.length
      ? links.map(l => {
          const isTel = l.url.startsWith('tel:');
          return `<a href="${l.url}" ${isTel ? '' : 'target="_blank" rel="noopener"'}>${l.icon} ${l.label}</a>`;
        }).join('')
      : `<span class="hint">لینک شبکه‌های اجتماعی هنوز در پنل ادمین ثبت نشده است.</span>`;
  }
}

function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}

function setActiveNav() {
  const page = document.body.getAttribute('data-page');
  document.querySelectorAll('nav.main-nav a[data-nav]').forEach(a => {
    if (a.getAttribute('data-nav') === page) a.classList.add('active');
  });
}

function initMenuToggle() {
  const btn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav.main-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

document.addEventListener('DOMContentLoaded', () => {
  renderTicker();
  renderCartCount();
  setActiveNav();
  initMenuToggle();
  renderSocialLinks();
  trySyncRateFromServer();
});
