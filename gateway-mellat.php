<?php
/**
 * ==========================================================================
 * اتصال به درگاه پرداخت «به‌پرداخت ملت» (Behpardakht Mellat)
 * ==========================================================================
 * این فایل یک اسکلت آماده است؛ چون شماره‌ی پذیرنده (terminalId) و کاربری/
 * رمز وب‌سرویس بانک ملت را فقط بعد از عقد قرارداد با بانک دریافت می‌کنید،
 * فعلاً این مقادیر خالی گذاشته شده‌اند. وقتی آن‌ها را از بانک گرفتید،
 * کافی‌ست مقادیر زیر را پر کنید و همین فایل کار می‌کند.
 *
 * جریان کار درگاه (استاندارد به‌پرداخت ملت):
 *   ۱) سایت به این فایل با مبلغ و شماره سفارش POST می‌زند.
 *   ۲) این فایل با متد bpPayRequest از وب‌سرویس بانک یک "RefId" می‌گیرد.
 *   ۳) کاربر به صفحه‌ی پرداخت بانک هدایت می‌شود:
 *      https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=...
 *   ۴) بعد از پرداخت، بانک کاربر را به callback_url برمی‌گرداند.
 *   ۵) در callback باید با متدهای bpVerifyRequest و bpSettleRequest
 *      تراکنش را نهایی کنید.
 * ==========================================================================
 */

header('Content-Type: application/json; charset=utf-8');

// ------------------------- اطلاعات پذیرنده (بعد از عقد قرارداد پر شود) -------------------------
$TERMINAL_ID = '';   // شماره ترمینال از بانک ملت
$USERNAME    = '';   // یوزرنیم وب‌سرویس
$PASSWORD    = '';   // رمز وب‌سرویس
$CALLBACK_URL = 'https://yourdomain.ir/gateway-mellat-callback.php';
$WSDL = 'https://bpm.shaparak.ir/pgwchannel/services/pgw?wsdl';
// -------------------------------------------------------------------------------------------------

if (empty($TERMINAL_ID) || empty($USERNAME) || empty($PASSWORD)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'message' => 'درگاه به‌پرداخت ملت هنوز تنظیم نشده. اطلاعات پذیرندگی (TERMINAL_ID / USERNAME / PASSWORD) را در همین فایل وارد کنید.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$amountRial = (int) ($input['amountRial'] ?? 0); // مبلغ باید به ریال باشد
$orderId = $input['orderId'] ?? '';

if ($amountRial <= 0 || empty($orderId)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'مبلغ یا شماره سفارش نامعتبر است.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $client = new SoapClient($WSDL, ['encoding' => 'UTF-8']);
    $localDate = date('Ymd');
    $localTime = date('His');
    // orderId باید یک عدد یکتا باشد؛ چون شماره سفارش سایت شبیه ORD-XXXX است،
    // از crc32 برای تبدیل به عدد استفاده می‌کنیم.
    $numericOrderId = abs(crc32($orderId));

    $result = $client->bpPayRequest([
        'terminalId'   => $TERMINAL_ID,
        'userName'     => $USERNAME,
        'userPassword' => $PASSWORD,
        'orderId'      => $numericOrderId,
        'amount'       => $amountRial,
        'localDate'    => $localDate,
        'localTime'    => $localTime,
        'additionalData' => 'خرید از فروشگاه قصر طلا',
        'callBackUrl'  => $CALLBACK_URL,
        'payerId'      => 0
    ])->return;

    [$resCode, $refId] = explode(',', $result);

    if ($resCode === '0') {
        echo json_encode([
            'ok' => true,
            'paymentUrl' => 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=' . $refId
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['ok' => false, 'message' => 'خطای بانک، کد: ' . $resCode], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'خطا در ارتباط با درگاه: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
