/*
  ==========================================================================
  دریافت نرخ طلا از کانال تلگرام
  ==========================================================================
  تلگرام هیچ راهی برای «خواندن مستقیم و بدون ربات» یک کانال از داخل مرورگر
  در اختیار نمی‌گذارد. برای خودکارسازی این کار دو گزینه وجود دارد:

  گزینه‌ی ۱ (ساده‌تر، برای شروع): وارد کردن دستی نرخ در تب «نرخ طلا» توسط
  ادمین، هر بار که نرخ اتحادیه عوض می‌شود. همین الان کار می‌کند.

  گزینه‌ی ۲ (خودکار): ساخت یک ربات تلگرام:
    ۱) در تلگرام به @BotFather پیام بده و دستور /newbot را بزن، یک نام برای
       ربات انتخاب کن و «توکن» ربات را کپی کن.
    ۲) ربات را به‌عنوان عضو (ترجیحاً ادمین) کانال نرخ اتحادیه اضافه کن تا
       بتواند پیام‌های کانال را ببیند.
    ۳) توکن ربات و آیدی عددی کانال (chat id) را در تب «نرخ طلا» وارد کن.
    ۴) روی «دریافت خودکار نرخ» بزن.

  ⚠️ نکته‌ی مهم: تماس مستقیم مرورگر با api.telegram.org معمولاً به دلیل
  سیاست‌های CORS با خطا مواجه می‌شود. راه‌حل مطمئن این است که یک اسکریپت
  کوچک روی همان سروری که سایت را میزبانی می‌کند اجرا شود (نمونه‌ی آماده در
  fetch_rate.php) و هر چند دقیقه یک‌بار (با cron job) نرخ را از
  تلگرام بگیرد و در فایل rate.json ذخیره کند؛ سایت هم همان فایل را می‌خواند.
  توضیح کامل در README-telegram.md آمده است.
  ==========================================================================
*/

async function tryFetchTelegramRate(botToken, chatUsername, pattern) {
  if (!botToken) throw new Error('توکن ربات وارد نشده است.');
  const url = `https://api.telegram.org/bot${botToken}/getUpdates?limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('پاسخی از تلگرام دریافت نشد (احتمالاً به دلیل محدودیت CORS مرورگر - به بخش راهنما مراجعه کنید).');
  const data = await res.json();
  if (!data.ok) throw new Error('توکن ربات نامعتبر است یا ربات هنوز پیامی دریافت نکرده.');

  const posts = (data.result || [])
    .map(u => u.channel_post || u.message)
    .filter(Boolean)
    .filter(m => !chatUsername || (m.chat && (m.chat.username === chatUsername.replace('@', '') || String(m.chat.id) === chatUsername)));

  if (!posts.length) throw new Error('پیامی از کانال موردنظر پیدا نشد. مطمئن شو ربات عضو کانال است.');

  const last = posts[posts.length - 1];
  const text = last.text || last.caption || '';
  const regex = new RegExp(pattern || '([0-9,]{6,})');
  const match = text.match(regex);
  if (!match) throw new Error('عددی مطابق الگوی تعیین‌شده در آخرین پیام کانال پیدا نشد.');

  const rate = parseInt(match[1].replace(/,/g, ''), 10);
  return { rate, sourceText: text, date: new Date(last.date * 1000).toISOString() };
}
