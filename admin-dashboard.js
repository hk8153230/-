if (!isAdminLoggedIn()) location.href = 'admin-login.html';

const view = document.getElementById('admin-view');
const nav = document.getElementById('admin-nav');

document.getElementById('logout-btn').addEventListener('click', () => {
  setAdminSession(false);
  location.href = 'admin-login.html';
});

nav.addEventListener('click', e => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render(btn.getAttribute('data-tab'));
});

function render(tab) {
  const map = {
    dashboard: renderDashboard,
    products: renderProducts,
    orders: renderOrders,
    articles: renderArticles,
    rate: renderRate,
    settings: renderSettings
  };
  (map[tab] || renderDashboard)();
}

function openModal(html) {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  bd.innerHTML = `<div class="modal">${html}</div>`;
  bd.addEventListener('click', e => { if (e.target === bd) bd.remove(); });
  document.body.appendChild(bd);
  return bd;
}

/* ============================== داشبورد ============================== */
function renderDashboard() {
  const products = getProducts();
  const orders = getOrders();
  const settings = getSettings();
  const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => o.status === 'در انتظار پرداخت').length;

  view.innerHTML = `
    <div class="admin-topbar"><h1>داشبورد</h1></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="num">${toFaDigits(products.length)}</div><div class="label">تعداد محصولات</div></div>
      <div class="stat-card"><div class="num">${toFaDigits(orders.length)}</div><div class="label">تعداد سفارش‌ها</div></div>
      <div class="stat-card"><div class="num">${toFaDigits(pending)}</div><div class="label">سفارش‌های در انتظار</div></div>
      <div class="stat-card"><div class="num">${formatToman(settings.ratePerGram)}</div><div class="label">نرخ فعلی هر گرم طلا</div></div>
    </div>
    <h3 style="font-size:16px;margin-bottom:12px">آخرین سفارش‌ها</h3>
    <table class="admin-table">
      <thead><tr><th>شماره سفارش</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
      <tbody>
        ${orders.slice(0,6).map(o => `
          <tr>
            <td>${o.id}</td>
            <td>${o.customer ? o.customer.name : '—'}</td>
            <td>${formatToman(o.total)}</td>
            <td><span class="badge pending">${o.status}</span></td>
            <td>${new Date(o.date).toLocaleDateString('fa-IR')}</td>
          </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--cream-dim)">هنوز سفارشی ثبت نشده است.</td></tr>`}
      </tbody>
    </table>
  `;
}

/* ============================== محصولات ============================== */
function renderProducts() {
  const products = getProducts();
  view.innerHTML = `
    <div class="admin-topbar">
      <h1>محصولات</h1>
      <button class="btn btn-gold btn-sm" id="new-product">+ افزودن محصول</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>تصویر</th><th>نام</th><th>دسته</th><th>وزن (گرم)</th><th>اجرت٪</th><th>قیمت لحظه‌ای</th><th></th></tr></thead>
      <tbody>
        ${products.map(p => {
          const price = calcProductPrice(p, getSettings());
          return `<tr>
            <td>${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width:40px;height:40px;object-fit:cover;border-radius:2px">` : '—'}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${toFaDigits(p.weight)}</td>
            <td>${toFaDigits(p.laborPercent)}٪</td>
            <td>${formatToman(price.total)}</td>
            <td style="display:flex;gap:6px">
              <button class="icon-btn" data-edit="${p.id}">ویرایش</button>
              <button class="icon-btn" data-del="${p.id}">حذف</button>
            </td>
          </tr>`;
        }).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--cream-dim)">محصولی ثبت نشده است.</td></tr>`}
      </tbody>
    </table>
  `;

  document.getElementById('new-product').addEventListener('click', () => productModal(null));
  view.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => productModal(getProduct(b.getAttribute('data-edit')))));
  view.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    if (confirm('این محصول حذف شود؟')) { deleteProduct(b.getAttribute('data-del')); renderProducts(); }
  }));
}

function productModal(product) {
  const isEdit = !!product;
  product = product || { name: '', category: '', weight: '', laborPercent: 15, purity: 18, sku: '', description: '', images: [] };

  const bd = openModal(`
    <h3>${isEdit ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
    <form id="product-form">
      <div class="form-row">
        <div class="field"><label>نام محصول</label><input name="name" required value="${product.name}"></div>
        <div class="field"><label>دسته‌بندی</label><input name="category" required value="${product.category}" list="cat-list"></div>
      </div>
      <datalist id="cat-list">${[...new Set(getProducts().map(p=>p.category))].map(c=>`<option value="${c}">`).join('')}</datalist>
      <div class="form-row">
        <div class="field"><label>وزن (گرم)</label><input name="weight" type="number" step="0.01" required value="${product.weight}"></div>
        <div class="field"><label>عیار</label><input name="purity" type="number" value="${product.purity || 18}"></div>
     
        <div class="field"><label>کد کالا (SKU)</label><input name="sku" value="${product.sku || ''}"></div>
      </div>
      <div class="field"><label>توضیحات</label><textarea name="description" rows="3">${product.description || ''}</textarea></div>
      <div class="field">
        <label>تصاویر محصول</label>
        <input type="file" id="img-input" accept="image/*" multiple>
        <div class="img-preview-row" id="img-preview"></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button type="submit" class="btn btn-gold btn-block">ذخیره</button>
        <button type="button" class="btn btn-outline" id="cancel-modal">انصراف</button>
      </div>
    </form>
  `);

  let images = [...(product.images || [])];
  const preview = () => {
    bd.querySelector('#img-preview').innerHTML = images.map((src,i) =>
      `<div style="position:relative"><img src="${src}"><button type="button" data-rm="${i}" style="position:absolute;top:-6px;left:-6px;background:var(--wine);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;line-height:1">×</button></div>`
    ).join('');
    bd.querySelectorAll('[data-rm]').forEach(x => x.addEventListener('click', () => {
      images.splice(parseInt(x.getAttribute('data-rm')), 1); preview();
    }));
  };
  preview();

  bd.querySelector('#img-input').addEventListener('change', ev => {
    [...ev.target.files].forEach(file => {
      const reader = new FileReader();
      reader.onload = e => { images.push(e.target.result); preview(); };
      reader.readAsDataURL(file);
    });
  });

  bd.querySelector('#cancel-modal').addEventListener('click', () => bd.remove());
  bd.querySelector('#product-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      id: isEdit ? product.id : undefined,
      name: fd.get('name'), category: fd.get('category'),
      weight: parseFloat(fd.get('weight')), purity: parseInt(fd.get('purity')) || 18,
      laborPercent: parseFloat(fd.get('laborPercent')), sku: fd.get('sku'),
      description: fd.get('description'), images
    };
    saveProduct(payload);
    bd.remove();
    renderProducts();
    toastAdmin('محصول ذخیره شد');
  });
}

/* ============================== سفارش‌ها ============================== */
const ORDER_STATUSES = ['در انتظار پرداخت', 'پرداخت‌شده', 'در حال آماده‌سازی', 'ارسال‌شده', 'لغو‌شده'];

function renderOrders() {
  const orders = getOrders();
  view.innerHTML = `
    <div class="admin-topbar"><h1>سفارش‌ها</h1></div>
    <table class="admin-table">
      <thead><tr><th>شماره</th><th>مشتری</th><th>تلفن</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>${o.id}</td>
            <td>${o.customer ? o.customer.name : '—'}</td>
            <td>${o.customer ? o.customer.phone : '—'}</td>
            <td>${formatToman(o.total)}</td>
            <td>
              <select data-status="${o.id}" style="background:var(--ink);color:var(--cream);border:1px solid var(--line);padding:5px 8px;border-radius:2px;font-size:12.5px">
                ${ORDER_STATUSES.map(s => `<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
              </select>
            </td>
            <td>${new Date(o.date).toLocaleDateString('fa-IR')}</td>
            <td><button class="icon-btn" data-view="${o.id}">جزئیات</button></td>
          </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--cream-dim)">هنوز سفارشی ثبت نشده است.</td></tr>`}
      </tbody>
    </table>
  `;

  view.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', () => {
    updateOrderStatus(sel.getAttribute('data-status'), sel.value);
    toastAdmin('وضعیت سفارش به‌روزرسانی شد');
  }));

  view.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    const o = orders.find(x => x.id === b.getAttribute('data-view'));
    openModal(`
      <h3>سفارش ${o.id}</h3>
      <p class="hint">مشتری: ${o.customer.name} — ${o.customer.phone}</p>
      <p class="hint">آدرس: ${o.customer.address}</p>
      ${o.customer.note ? `<p class="hint">توضیحات: ${o.customer.note}</p>` : ''}
      <div class="divider"></div>
      ${o.items.map(it => `<div style="display:flex;justify-content:space-between;font-size:13.5px;padding:6px 0;color:var(--cream-dim)"><span>${it.name} × ${toFaDigits(it.qty)}</span><span>${formatToman(it.unitPrice*it.qty)}</span></div>`).join('')}
      <div class="price-breakdown" style="margin-top:12px"><div class="total"><span>جمع کل</span><span>${formatToman(o.total)}</span></div></div>
    `);
  }));
}

/* ============================== مقالات ============================== */
function renderArticles() {
  const articles = getArticles();
  view.innerHTML = `
    <div class="admin-topbar">
      <h1>مقالات</h1>
      <button class="btn btn-gold btn-sm" id="new-article">+ مقاله جدید</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>عنوان</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>
        ${articles.map(a => `
          <tr>
            <td>${a.title}</td>
            <td>${new Date(a.date).toLocaleDateString('fa-IR')}</td>
            <td style="display:flex;gap:6px">
              <button class="icon-btn" data-edit="${a.id}">ویرایش</button>
              <button class="icon-btn" data-del="${a.id}">حذف</button>
            </td>
          </tr>`).join('') || `<tr><td colspan="3" style="text-align:center;color:var(--cream-dim)">مقاله‌ای ثبت نشده است.</td></tr>`}
      </tbody>
    </table>
  `;
  document.getElementById('new-article').addEventListener('click', () => articleModal(null));
  view.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => articleModal(getArticle(b.getAttribute('data-edit')))));
  view.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    if (confirm('این مقاله حذف شود؟')) { deleteArticle(b.getAttribute('data-del')); renderArticles(); }
  }));
}

function articleModal(article) {
  const isEdit = !!article;
  article = article || { title: '', summary: '', content: '' };
  const bd = openModal(`
    <h3>${isEdit ? 'ویرایش مقاله' : 'مقاله جدید'}</h3>
    <form id="article-form">
      <div class="field"><label>عنوان</label><input name="title" required value="${article.title}"></div>
      <div class="field"><label>خلاصه</label><input name="summary" required value="${article.summary}"></div>
      <div class="field"><label>متن کامل</label><textarea name="content" rows="6" required>${article.content}</textarea></div>
      <div style="display:flex;gap:10px">
        <button type="submit" class="btn btn-gold btn-block">ذخیره</button>
        <button type="button" class="btn btn-outline" id="cancel-modal">انصراف</button>
      </div>
    </form>
  `);
  bd.querySelector('#cancel-modal').addEventListener('click', () => bd.remove());
  bd.querySelector('#article-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveArticle({ id: isEdit ? article.id : undefined, title: fd.get('title'), summary: fd.get('summary'), content: fd.get('content') });
    bd.remove();
    renderArticles();
    toastAdmin('مقاله ذخیره شد');
  });
}

/* ============================== نرخ طلا و تلگرام ============================== */
function renderRate() {
  const s = getSettings();
  view.innerHTML = `
    <div class="admin-topbar"><h1>نرخ طلا و تلگرام</h1></div>

    <h3 style="font-size:16px;margin-bottom:12px">ثبت دستی نرخ (همین الان کار می‌کند)</h3>
    <form id="rate-form" style="max-width:520px">
      <div class="form-row">
        <div class="field"><label>نرخ هر گرم طلای ۱۸ عیار (تومان)</label><input name="ratePerGram" type="number" required value="${s.ratePerGram}"></div>
        <div class="field"><label>درصد سود ثابت (پیش‌فرض ۷٪ برای همه‌ی کالاها)</label><input name="profitPercent" type="number" step="0.1" required value="${s.profitPercent}"></div>
      </div>
      <button class="btn btn-gold" type="submit">به‌روزرسانی نرخ</button>
      <p class="hint" style="margin-top:8px">آخرین به‌روزرسانی: ${s.lastRateUpdate ? new Date(s.lastRateUpdate).toLocaleString('fa-IR') : 'هنوز ثبت نشده'}</p>
    </form>

    <div class="divider"></div>

    <h3 style="font-size:16px;margin-bottom:6px">دریافت خودکار نرخ از کانال @etjmir</h3>
    <p class="hint" style="margin-bottom:16px">چون این کانال عمومی است، نیازی به ساختن ربات نیست. کافیست فایل <code>fetch_rate.php</code> روی هاست واقعی سایت با یک Cron Job هر چند دقیقه اجرا شود؛ بعد از آن، این صفحه و کل سایت خودکار نرخ را از فایل <code>rate.json</code> می‌خوانند. راهنمای کامل گام‌به‌گام در فایل <code>README-telegram.md</code> است.</p>
    <div class="field" style="max-width:520px"><label>لینک کانال</label><input name="telegramChannelLink" id="tg-link" placeholder="https://t.me/etjmir" value="${s.telegramChannelLink || ''}"></div>
    <div style="display:flex;gap:10px">
      <button type="button" class="btn btn-outline" id="save-tg-link">ذخیره لینک کانال</button>
      <button type="button" class="btn btn-wine" id="fetch-now">همگام‌سازی نرخ از سرور (rate.json)</button>
    </div>
    <p class="hint" id="tg-result" style="margin-top:12px"></p>
  `;

  document.getElementById('rate-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveSettings({ ratePerGram: parseFloat(fd.get('ratePerGram')), profitPercent: parseFloat(fd.get('profitPercent')), lastRateUpdate: new Date().toISOString() });
    toastAdmin('نرخ به‌روزرسانی شد — قیمت همه‌ی محصولات در سایت هم‌اکنون به‌روز شد');
    renderRate();
  });

  document.getElementById('save-tg-link').addEventListener('click', () => {
    saveSettings({ telegramChannelLink: document.getElementById('tg-link').value });
    toastAdmin('لینک کانال ذخیره شد');
  });

  document.getElementById('fetch-now').addEventListener('click', async () => {
    const resEl = document.getElementById('tg-result');
    resEl.textContent = 'در حال تلاش برای دریافت نرخ...';
    try {
      const res = await fetch('rate.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rate) {
          saveSettings({ ratePerGram: data.rate, lastRateUpdate: data.updatedAt || new Date().toISOString() });
          resEl.style.color = '#8fd08f';
          resEl.textContent = `موفق: نرخ ${formatToman(data.rate)} از فایل rate.json (تولیدشده توسط Cron Job) خوانده و ثبت شد.`;
          renderRate();
          return;
        }
      }
      throw new Error('فایل rate.json هنوز موجود نیست (یعنی سایت هنوز روی سرور واقعی با Cron Job مستقر نشده).');
    } catch (err) {
      resEl.style.color = '#e79999';
      resEl.textContent = 'خطا: ' + err.message + ' — تا وقتی سایت به سرور واقعی وصل نشده، نرخ رو دستی وارد کن. راهنمای کامل در README-telegram.md است.';
    }
  });
}

/* ============================== تنظیمات فروشگاه ============================== */
function renderSettings() {
  const s = getSettings();
  view.innerHTML = `
    <div class="admin-topbar"><h1>تنظیمات فروشگاه</h1></div>
    <form id="store-form" style="max-width:520px">
      <div class="field"><label>نام فروشگاه</label><input name="storeName" value="${s.storeName || ''}"></div>
      <div class="field"><label>شماره تماس</label><input name="storePhone" value="${s.storePhone || ''}"></div>
      <div class="field"><label>آدرس</label><textarea name="storeAddress" rows="2">${s.storeAddress || ''}</textarea></div>
      <button class="btn btn-gold" type="submit">ذخیره</button>
    </form>
    <div class="divider"></div>
    <h3 style="font-size:16px;margin-bottom:6px">شبکه‌های اجتماعی و کانال‌ها</h3>
    <p class="hint" style="margin-bottom:14px">این لینک‌ها پایین همه‌ی صفحه‌های سایت و در صفحه‌ی «درباره ما» نمایش داده می‌شوند و با کلیک، مستقیم به همان برنامه (تلگرام/ایتا) باز می‌شوند. هر کدام را خالی بگذارید، نمایش داده نمی‌شود.</p>
    <form id="social-form" style="max-width:520px">
      <div class="field"><label>لینک گروه تلگرام</label><input name="socialTelegramGroup" placeholder="https://t.me/joinchat/..." value="${s.socialTelegramGroup || ''}"></div>
      <div class="field"><label>ارتباط مستقیم در تلگرام</label><input name="socialTelegram" placeholder="https://t.me/yourchannel" value="${s.socialTelegram || ''}"></div>
      <div class="field"><label>لینک گروه ایتا</label><input name="socialEitaaGroup" placeholder="https://eitaa.com/joinchat/..." value="${s.socialEitaaGroup || ''}"></div>
      <div class="field"><label>لینک ارتباط مستقیم در ایتا</label><input name="socialEitaaContact" placeholder="https://eitaa.com/username" value="${s.socialEitaaContact || ''}"></div>
      <div class="field"><label>لینک اینستاگرام</label><input name="socialInstagram" placeholder="https://instagram.com/yourpage" value="${s.socialInstagram || ''}"></div>
      <div class="field"><label>لینک واتس‌اپ</label><input name="socialWhatsapp" placeholder="https://wa.me/98912xxxxxxx" value="${s.socialWhatsapp || ''}"></div>
      <button class="btn btn-outline" type="submit">ذخیره لینک‌ها</button>
    </form>
    <div class="divider"></div>
    <h3 style="font-size:16px;margin-bottom:12px">تغییر رمز ورود ادمین</h3>
    <form id="pass-form" style="max-width:520px">
      <div class="field"><label>نام کاربری جدید</label><input name="username" value="admin" required></div>
      <div class="field"><label>رمز عبور جدید</label><input name="password" type="password" required minlength="4"></div>
      <button class="btn btn-outline" type="submit">به‌روزرسانی اطلاعات ورود</button>
    </form>
  `;
  document.getElementById('store-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveSettings({ storeName: fd.get('storeName'), storePhone: fd.get('storePhone'), storeAddress: fd.get('storeAddress') });
    toastAdmin('تنظیمات ذخیره شد');
  });
  document.getElementById('social-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveSettings({
      socialTelegramGroup: fd.get('socialTelegramGroup'),
      socialTelegram: fd.get('socialTelegram'),
      socialEitaaGroup: fd.get('socialEitaaGroup'),
      socialEitaaContact: fd.get('socialEitaaContact'),
      socialInstagram: fd.get('socialInstagram'),
      socialWhatsapp: fd.get('socialWhatsapp')
    });
    toastAdmin('لینک‌های شبکه‌های اجتماعی ذخیره شد');
  });
  document.getElementById('pass-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    localStorage.setItem(DB_KEYS.adminAuth, JSON.stringify({ username: fd.get('username'), password: fd.get('password') }));
    toastAdmin('اطلاعات ورود به‌روزرسانی شد');
  });
}

function toastAdmin(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}

render('dashboard');
