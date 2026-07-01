<?php
/**
 * ==========================================================================
 * دریافت خودکار نرخ طلا از کانال تلگرام (سمت سرور)
 * ==========================================================================
 * این اسکریپت را روی هاست خودتان قرار دهید (کنار همین پوشه‌ی سایت) و با
 * یک Cron Job هر ۲ تا ۵ دقیقه یک‌بار اجرا کنید، مثلاً:
 *
 *   * / 5 * * * * php /path/to/server/fetch_rate.php
 *
 * این اسکریپت آخرین پیام کانال تلگرام را می‌خواند، عدد نرخ را با یک الگوی
 * ساده (Regex) استخراج می‌کند و در فایل rate.json ذخیره می‌کند. سپس صفحه‌ی
 * ادمین یا حتی خودِ سایت می‌تواند rate.json را بخواند و نرخ را به‌روز کند.
 *
 * پیش‌نیازها:
 *   ۱) یک ربات از طریق @BotFather در تلگرام بسازید و توکن آن را در BOT_TOKEN
 *      قرار دهید.
 *   ۲) ربات را به‌عنوان عضو (یا ادمین) کانال نرخ اتحادیه اضافه کنید.
 *   ۳) یوزرنیم یا آیدی عددی کانال را در CHANNEL قرار دهید.
 * ==========================================================================
 */

// ------------------------- تنظیمات را اینجا وارد کنید -------------------------
$BOT_TOKEN = 'PUT_YOUR_BOT_TOKEN_HERE';      // توکن ربات از BotFather
$CHANNEL   = '@your_channel_username';        // یوزرنیم یا chat id عددی کانال
$RATE_REGEX = '/([0-9,]{6,})/';               // الگوی استخراج عدد نرخ از متن پیام
$OUTPUT_FILE = __DIR__ . '/rate.json';
// -------------------------------------------------------------------------------

function tg_api($method, $token, $params = []) {
    $url = "https://api.telegram.org/bot{$token}/{$method}";
    if (!empty($params)) $url .= '?' . http_build_query($params);
    $ctx = stream_context_create(['http' => ['timeout' => 10]]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) return null;
    return json_decode($res, true);
}

$updates = tg_api('getUpdates', $BOT_TOKEN, ['limit' => 50]);

if (!$updates || empty($updates['ok'])) {
    file_put_contents($OUTPUT_FILE, json_encode(['error' => 'عدم دریافت پاسخ معتبر از تلگرام. توکن ربات را بررسی کنید.'], JSON_UNESCAPED_UNICODE));
    exit;
}

$lastText = null;
$lastDate = null;

foreach (array_reverse($updates['result']) as $u) {
    $msg = $u['channel_post'] ?? $u['message'] ?? null;
    if (!$msg) continue;
    $chat = $msg['chat'] ?? [];
    $matchesChannel = empty($CHANNEL)
        || (isset($chat['username']) && '@' . $chat['username'] === $CHANNEL)
        || (isset($chat['id']) && (string)$chat['id'] === $CHANNEL);
    if (!$matchesChannel) continue;

    $text = $msg['text'] ?? ($msg['caption'] ?? '');
    if ($text) { $lastText = $text; $lastDate = $msg['date']; break; }
}

if ($lastText === null) {
    file_put_contents($OUTPUT_FILE, json_encode(['error' => 'پیامی از کانال موردنظر پیدا نشد. مطمئن شوید ربات عضو کانال است.'], JSON_UNESCAPED_UNICODE));
    exit;
}

if (preg_match($RATE_REGEX, $lastText, $m)) {
    $rate = (int) str_replace(',', '', $m[1]);
    file_put_contents($OUTPUT_FILE, json_encode([
        'rate' => $rate,
        'sourceText' => $lastText,
        'updatedAt' => date('c', $lastDate ?: time())
    ], JSON_UNESCAPED_UNICODE));
    echo "OK: rate={$rate}\n";
} else {
    file_put_contents($OUTPUT_FILE, json_encode(['error' => 'عددی مطابق الگو در آخرین پیام پیدا نشد.', 'sourceText' => $lastText], JSON_UNESCAPED_UNICODE));
}
