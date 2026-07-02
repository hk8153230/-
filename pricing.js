/*
  فرمول محاسبه قیمت (استاندارد بازار طلای ایران):
  ۱) قیمت پایه = وزن (گرم) × نرخ هر گرم طلا (از تنظیمات ادمین/کانال اتحادیه)
  ۲) اجرت ساخت = قیمت پایه × (درصد اجرت همان کالا ÷ 100)
  ۳) سود فروشنده = (قیمت پایه + اجرت) × (درصد سود ÷ 100)   -- پیش‌فرض ۷٪ برای همه‌ی کالاها
  ۴) قیمت نهایی = قیمت پایه + اجرت + سود
  (در صورت نیاز به مالیات بر ارزش افزوده، می‌توان مرحله‌ی پنجم را در همین فایل اضافه کرد)
*/

function calcPrice(weightGrams, ratePerGram, laborPercent, profitPercent) {
  const w = Number(weightGrams) || 0;
  const rate = Number(ratePerGram) || 0;
  const labor = Number(laborPercent) || 0;
  const profit = Number(profitPercent) || 0;

  const base = w * rate;
  const laborAmount = base * (labor / 100);
  const profitAmount = (base + laborAmount) * (profit / 100);
  const total = base + laborAmount + profitAmount;

  return {
    base: Math.round(base),
    labor: Math.round(laborAmount),
    profit: Math.round(profitAmount),
    total: Math.round(total)
  };
}

function calcProductPrice(product, settings) {
  return calcPrice(
    product.weight,
    settings.ratePerGram,
    product.laborPercent,
    settings.profitPercent
  );
}

function formatToman(n) {
  const num = Math.round(Number(n) || 0);
  return num.toLocaleString('fa-IR') + ' تومان';
}

function toFaDigits(n) {
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
