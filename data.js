/*
  ==========================================================================
  لایه‌ی داده (Data Service)
  ==========================================================================
  همه‌ی صفحات سایت فقط از طریق توابع همین فایل با «داده‌ها» کار می‌کنند
  (محصولات، سفارش‌ها، تنظیمات نرخ، سبد خرید، مقاله‌ها).

  در حال حاضر همه‌چیز در localStorage مرورگر ذخیره می‌شود تا سایت همین الان
  کامل و قابل تست باشد، بدون نیاز به سرور.

  ★ وقتی به سرور واقعی وصل شدیم: کافیست بدنه‌ی هر تابع را از localStorage
  به fetch('/api/...') تغییر بدهیم؛ چون بقیه‌ی سایت فقط اسم همین توابع را
  صدا می‌زند و کاری به جزئیات ذخیره‌سازی ندارد. محل دقیق تغییر هر تابع با
  کامنت «TODO API» مشخص شده است.
  ==========================================================================
*/

const DB_KEYS = {
  products: 'gs_products',
  orders: 'gs_orders',
  settings: 'gs_settings',
  cart: 'gs_cart',
  articles: 'gs_articles',
  adminAuth: 'gs_admin_auth'
};

function _read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function _write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function _uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ------------------------------ Seed data ------------------------------ */
const DEFAULT_SETTINGS = {
  ratePerGram: 8250000,       // نرخ هر گرم طلای ۱۸ عیار (تومان) - نمونه، در ادمین قابل ویرایش است
  profitPercent: 7,           // سود ثابت ۷٪ برای همه‌ی کالاها طبق درخواست شما
  telegramChannelLink: '',
  telegramBotToken: '',
  telegramChatId: '',
  lastRateUpdate: null,
  storeName: 'قصر طلا',
  storePhone: '0915-0057752',
  storeAddress: 'تهران، بازار بزرگ، سرای زرگری',
  yearsActive: 3,
  socialTelegram: '',
  socialTelegramGroup: 'https://t.me/ghasretaluRezakheradmand',
  socialEitaaGroup: 'https://eitaa.com/joinchat/2050032503Cab479c004a',
  socialEitaaContact: 'https://eitaa.com/Hossein1707',
  socialInstagram: '',
  socialWhatsapp: ''
};

function seedIfEmpty() {
  const existingSettings = _read(DB_KEYS.settings, null);
  if (!existingSettings) {
    // اولین بار: تنظیمات پیش‌فرض کامل را ذخیره کن
    _write(DB_KEYS.settings, { ...DEFAULT_SETTINGS });
  } else {
    // مهاجرت: اگر فیلد جدیدی به DEFAULT_SETTINGS اضافه شده (مثل لینک‌های جدید)
    // ولی تنظیمات ذخیره‌شده‌ی قبلی در مرورگر آن را ندارد، بدون از بین بردن
    // مقادیری که کاربر قبلاً خودش تغییر داده، فقط فیلدهای غایب را اضافه کن.
    let changed = false;
    const merged = { ...existingSettings };
    for (const key in DEFAULT_SETTINGS) {
      if (!(key in merged) || merged[key] === undefined) {
        merged[key] = DEFAULT_SETTINGS[key];
        changed = true;
      }
    }
    if (changed) _write(DB_KEYS.settings, merged);
  }
  if (!localStorage.getItem(DB_KEYS.products)) {
    _write(DB_KEYS.products, [
      { id: _uid(), name: 'گردنبند طرح برگ', category: 'گردنبند', weight: 4.2, laborPercent: 18, purity: 18, sku: 'NCK-001', description: 'گردنبند ظریف طرح برگ، مناسب استفاده روزمره، ساخت دست.', images: [] },
      { id: _uid(), name: 'دستبند زنجیری کلاسیک', category: 'دستبند', weight: 6.8, laborPercent: 15, purity: 18, sku: 'BRC-001', description: 'دستبند زنجیری با طراحی کلاسیک و قفل ایمن.', images: [] },
      { id: _uid(), name: 'انگشتر سولیتر', category: 'انگشتر', weight: 3.1, laborPercent: 22, purity: 18, sku: 'RNG-001', description: 'انگشتر تک‌نگین با کار ظریف روی حلقه.', images: [] },
      { id: _uid(), name: 'گوشواره مروارید', category: 'گوشواره', weight: 2.4, laborPercent: 20, purity: 18, sku: 'EAR-001', description: 'گوشواره طلا با نگین مروارید، مناسب مجالس.', images: [] },
      { id: _uid(), name: 'ست نامزدی رزگلد', category: 'ست', weight: 12.5, laborPercent: 16, purity: 18, sku: 'SET-001', description: 'ست کامل گردنبند، دستبند و گوشواره رزگلد.', images: [] },
      { id: _uid(), name: 'النگو ساده', category: 'دستبند', weight: 9.0, laborPercent: 12, purity: 18, sku: 'BRC-002', description: 'النگو با سطح صاف و براق، وزن مناسب.', images: [] }
    ]);
  }
  if (!localStorage.getItem(DB_KEYS.articles)) {
    _write(DB_KEYS.articles, [
      {
        id: _uid(),
        title: 'چگونه عیار طلا را تشخیص دهیم؟',
        summary: 'راهنمای کوتاه برای فهمیدن تفاوت عیار ۱۸ و ۲۴ و تاثیر آن روی قیمت.',
        content: 'عیار طلا میزان خلوص آن را نشان می‌دهد. طلای ۲۴ عیار خالص‌ترین نوع است اما به دلیل نرمی، معمولاً برای زیورآلات مناسب نیست. طلای ۱۸ عیار با ترکیب فلزات دیگر، ماندگاری بیشتری در برابر خط و خش دارد و رایج‌ترین انتخاب برای جواهرات روزمره است. هنگام خرید همیشه مهر عیار حک‌شده روی قطعه را بررسی کنید.',
        cover: '',
        date: new Date().toISOString()
      },
      {
        id: _uid(),
        title: 'نگهداری صحیح از جواهرات طلا',
        summary: 'چند نکته ساده برای اینکه طلای شما همیشه براق بماند.',
        content: 'برای نگهداری طلا از تماس مستقیم با عطر و مواد شیمیایی خودداری کنید. جواهرات را جداگانه در پارچه نرم نگه دارید تا با هم اصطکاک نداشته باشند. تمیز کردن دوره‌ای با آب گرم و کمی مایع ظرفشویی ملایم، براقیت طلا را حفظ می‌کند.',
        cover: '',
        date: new Date().toISOString()
      }
    ]);
  }
  if (!localStorage.getItem(DB_KEYS.orders)) _write(DB_KEYS.orders, []);
  if (!localStorage.getItem(DB_KEYS.cart)) _write(DB_KEYS.cart, []);
  if (!localStorage.getItem(DB_KEYS.adminAuth)) {
    _write(DB_KEYS.adminAuth, { username: 'admin', password: 'admin123' });
  }
}

/* ------------------------------ Settings -------------------------------- */
function getSettings() {
  // TODO API: جایگزین با  return (await fetch('/api/settings')).json();
  seedIfEmpty();
  return _read(DB_KEYS.settings, {});
}
function saveSettings(patch) {
  // TODO API: جایگزین با  await fetch('/api/settings', {method:'PUT', body: JSON.stringify(patch)});
  const s = getSettings();
  const next = { ...s, ...patch };
  _write(DB_KEYS.settings, next);
  return next;
}

/* ------------------------------ Products --------------------------------- */
function getProducts() {
  // TODO API: return (await fetch('/api/products')).json();
  seedIfEmpty();
  return _read(DB_KEYS.products, []);
}
function getProduct(id) {
  return getProducts().find(p => p.id === id) || null;
}
function saveProduct(product) {
  // TODO API: POST یا PUT به /api/products
  const list = getProducts();
  if (product.id) {
    const idx = list.findIndex(p => p.id === product.id);
    if (idx > -1) list[idx] = product;
    else list.push(product);
  } else {
    product.id = _uid();
    list.push(product);
  }
  _write(DB_KEYS.products, list);
  return product;
}
function deleteProduct(id) {
  // TODO API: DELETE /api/products/:id
  const list = getProducts().filter(p => p.id !== id);
  _write(DB_KEYS.products, list);
}

/* ------------------------------ Orders ------------------------------------ */
function getOrders() {
  // TODO API: return (await fetch('/api/orders')).json();
  seedIfEmpty();
  return _read(DB_KEYS.orders, []);
}
function saveOrder(order) {
  // TODO API: POST /api/orders  -> بعد از اتصال به درگاه به‌پرداخت ملت، این تابع باید
  // پس از تایید تراکنش از سمت سرور صدا زده شود.
  const list = getOrders();
  order.id = 'ORD-' + _uid().toUpperCase();
  order.date = new Date().toISOString();
  order.status = order.status || 'در انتظار پرداخت';
  list.unshift(order);
  _write(DB_KEYS.orders, list);
  return order;
}
function updateOrderStatus(id, status) {
  const list = getOrders();
  const o = list.find(x => x.id === id);
  if (o) { o.status = status; _write(DB_KEYS.orders, list); }
}

/* ------------------------------ Cart --------------------------------------- */
function getCart() {
  seedIfEmpty();
  return _read(DB_KEYS.cart, []);
}
function addToCart(productId, qty = 1) {
  const cart = getCart();
  const line = cart.find(c => c.productId === productId);
  if (line) line.qty += qty;
  else cart.push({ productId, qty });
  _write(DB_KEYS.cart, cart);
  return cart;
}
function setCartQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(c => c.productId !== productId);
  } else {
    const line = cart.find(c => c.productId === productId);
    if (line) line.qty = qty;
  }
  _write(DB_KEYS.cart, cart);
  return cart;
}
function removeFromCart(productId) {
  const cart = getCart().filter(c => c.productId !== productId);
  _write(DB_KEYS.cart, cart);
  return cart;
}
function clearCart() {
  _write(DB_KEYS.cart, []);
}
function cartCount() {
  return getCart().reduce((sum, l) => sum + l.qty, 0);
}
function cartWithDetails() {
  const settings = getSettings();
  return getCart().map(line => {
    const product = getProduct(line.productId);
    if (!product) return null;
    const price = calcProductPrice(product, settings);
    return { ...line, product, price };
  }).filter(Boolean);
}

/* ------------------------------ Articles ------------------------------------ */
function getArticles() {
  seedIfEmpty();
  return _read(DB_KEYS.articles, []);
}
function getArticle(id) {
  return getArticles().find(a => a.id === id) || null;
}
function saveArticle(article) {
  const list = getArticles();
  if (article.id) {
    const idx = list.findIndex(a => a.id === article.id);
    if (idx > -1) list[idx] = article; else list.push(article);
  } else {
    article.id = _uid();
    article.date = new Date().toISOString();
    list.push(article);
  }
  _write(DB_KEYS.articles, list);
  return article;
}
function deleteArticle(id) {
  _write(DB_KEYS.articles, getArticles().filter(a => a.id !== id));
}

/* ------------------------------ Admin auth (نمونه‌ی ساده - غیرامن) ------------- */
function checkAdminLogin(username, password) {
  // TODO API: این باید حتماً روی سرور و با هش‌شدن رمز عبور انجام شود، نه در مرورگر.
  seedIfEmpty();
  const auth = _read(DB_KEYS.adminAuth, {});
  return auth.username === username && auth.password === password;
}
function isAdminLoggedIn() {
  return sessionStorage.getItem('gs_admin_session') === '1';
}
function setAdminSession(on) {
  if (on) sessionStorage.setItem('gs_admin_session', '1');
  else sessionStorage.removeItem('gs_admin_session');
}

seedIfEmpty();
