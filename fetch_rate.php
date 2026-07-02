<?php
/**
 * ==========================================================================
 * دریافت خودکار نرخ طلا از کانال عمومی تلگرام (بدون نیاز به ربات)
 * ==========================================================================
 * کانال @etjmir (اتحادیه صنف طلا، جواهر، نقره و سکه مشهد مقدس) یک کانال
 * عمومی است، یعنی صفحه‌ی وبی به آدرس https://t.me/s/etjmir دارد که هرکسی
 * (حتی بدون داشتن تلگرام) می‌تواند پیام‌های اخیرش را در مرورگر ببیند.
 *
 * به همین دلیل هیچ نیازی به ساختن ربات یا گرفتن اجازه از مدیر کانال نیست؛
 * این اسکریپت مستقیماً همان صفحه را می‌خواند و آخرین نرخ اعلام‌شده را
 * استخراج می‌کند.
 *
 * نحوه‌ی راه‌اندازی:
 *   این فایل را روی هاست سایت بگذارید و با یک Cron Job هر ۳ تا ۵ دقیقه
 *   اجرا کنید:
 *     * / 5 * * * * php /path/to/fetch_rate.php
 *   بعد از هر اجرا، فایل rate.json به‌روز می‌شود و خود سایت
 *   (تابع trySyncRateFromServer در ui.js) این فایل را می‌خواند و
 *   نرخ را در سایت اعمال می‌کند — کاملاً خودکار و بدون دخالت ادمین.
 * ==========================================================================
 */

// ------------------------- تنظیمات -------------------------
$CHANNEL_USERNAME = 'etjmir';                 // یوزرنیم کانال (بدون @)
// الگوی استخراج نرخ از متن پیام؛ چون پیام‌های این کانال دقیقاً به شکل
// «گرم‌طلای18عیار : 17,250,000 تومان» هستند:
$RATE_REGEX = '/گرم[^:]{0,30}?18[^:]{0,10}عیار\s*[:：]\s*([\d,]+)/u';
$OUTPUT_FILE = __DIR__ . '/rate.json';
// --------------------------------------------------------------

function fetch_html($url) {
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 12,
            'header'  => "User-Agent: Mozilla/5.0 (compatible; GoldRateBot/1.0)\r\n"
        ]
    ]);
    return @file_get_contents($url, false, $ctx);
}

$url = "https://t.me/s/{$CHANNEL_USERNAME}";
$html = fetch_html($url);

if ($html === false) {
    file_put_contents($OUTPUT_FILE, json_encode([
        'error' => 'اتصال به تلگرام برقرار نشد. ممکن است هاست شما دسترسی خروجی به اینترنت را مسدود کرده باشد.'
    ], JSON_UNESCAPED_UNICODE));
    exit;
}

// استخراج تمام بلوک‌های متنی پیام‌ها از HTML صفحه‌ی عمومی کانال
preg_match_all('/<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)<\/div>/su', $html, $matches);
$blocks = $matches[1] ?? [];

$rate = null;
$rawText = null;

// از آخرین پیام‌ها شروع می‌کنیم چون تازه‌ترین نرخ را می‌خواهیم
foreach (array_reverse($blocks) as $block) {
    $text = trim(html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $block)), ENT_QUOTES, 'UTF-8'));
    if (preg_match($RATE_REGEX, $text, $m)) {
        $rate = (int) str_replace(',', '', $m[1]);
        $rawText = $text;
        break;
    }
}

if ($rate === null) {
    file_put_contents($OUTPUT_FILE, json_encode([
        'error' => 'در پیام‌های اخیر کانال، عبارت نرخ طلای ۱۸ عیار پیدا نشد. ممکن است قالب پیام‌های کانال تغییر کرده باشد.'
    ], JSON_UNESCAPED_UNICODE));
    exit;
}

file_put_contents($OUTPUT_FILE, json_encode([
    'rate' => $rate,
    'sourceText' => $rawText,
    'updatedAt' => date('c')
], JSON_UNESCAPED_UNICODE));

echo "OK: rate={$rate}\n";
