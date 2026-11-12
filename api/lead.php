<?php
/**
 * Amazona Jungle Resort: form handler.
 * The "Register your interest" form and the booking request form post here.
 * This script checks the data, then forwards it to a Zapier "Catch Hook",
 * and the Zap creates or updates the contact in GoHighLevel.
 *
 * Setup: copy config.sample.php to config.php (same folder) and paste your Zapier hook URL in it,
 * or set the AMZ_ZAPIER_HOOK environment variable on the server.
 */
declare(strict_types=1);

$config = ['zapier_hook' => getenv('AMZ_ZAPIER_HOOK') ?: '', 'allowed_hosts' => [], 'rate_limit' => 6];
if (is_file(__DIR__ . '/config.php')) {
    $config = array_merge($config, (array) require __DIR__ . '/config.php');
}

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, int $status, string $message, bool $wantsJson, array $errors = []): void
{
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok, 'message' => $message, 'errors' => (object) $errors]);
        exit;
    }
    // Without JavaScript the browser posted the form directly: send it back to the form with the result.
    $back = '/booking.html';
    $ref = $_SERVER['HTTP_REFERER'] ?? '';
    if ($ref && parse_url($ref, PHP_URL_HOST) === ($_SERVER['HTTP_HOST'] ?? '')) {
        $back = strtok((string) parse_url($ref, PHP_URL_PATH), '?') ?: $back;
    }
    header('Location: ' . $back . '?lead=' . ($ok ? 'ok' : 'error') . '#register', true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 405, 'Method not allowed.', true);
}

// Only accept posts from our own pages.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $host = parse_url($origin, PHP_URL_HOST);
    $allowed = array_merge([$_SERVER['HTTP_HOST'] ?? ''], (array) $config['allowed_hosts']);
    $allowed = array_map(fn ($h) => preg_replace('/:\d+$/', '', strtolower((string) $h)), $allowed);
    if (!in_array(strtolower((string) $host), $allowed, true)) {
        respond(false, 403, 'Forbidden.', $wantsJson);
    }
}

/* ---------- read and clean the fields ---------- */
function field(string $key, int $max = 200): string
{
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) return '';
    $v = trim(strip_tags($v));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

// Spam traps: a hidden field people never fill, and forms sent faster than a person can type.
// Bots get a normal "thank you" so they don't retry, but nothing is forwarded.
$elapsed = field('elapsed_ms', 12);  // filled in by the page's script; empty when JavaScript is off
if (field('company_website') !== '' || ($elapsed !== '' && (int) $elapsed < 2000)) {
    respond(true, 200, 'Thank you.', $wantsJson);
}

$type = field('form_type', 40);
if (!in_array($type, ['register_interest', 'booking_request'], true)) {
    respond(false, 422, 'Unknown form.', $wantsJson);
}

$lead = [
    'form_type'        => $type,
    'first_name'       => field('first_name', 80),
    'last_name'        => field('last_name', 80),
    'email'            => strtolower(field('email', 160)),
    'phone'            => field('phone', 40),
    'residence'        => field('residence', 60),
    'residence_id'     => field('residence_id', 40),
    'guests'           => field('guests', 3),
    'check_in'         => field('check_in', 10),
    'check_out'        => field('check_out', 10),
    'nights'           => field('nights', 4),
    'message'          => field('message', 2000),
    'marketing_opt_in' => field('marketing_opt_in', 3) === 'yes' ? 'yes' : 'no',
    'rate_usd'         => field('rate_usd', 10),
    'discount_pct'     => field('discount_pct', 4),
    'total_usd'        => field('total_usd', 12),
    'payment_method'   => field('payment_method', 20),
    'booking_ref'      => field('booking_ref', 30),
    'display_currency' => field('display_currency', 3),
    'page_url'         => field('page_url', 500),
    'referrer'         => field('referrer', 500),
    'utm_source'       => field('utm_source', 120),
    'utm_medium'       => field('utm_medium', 120),
    'utm_campaign'     => field('utm_campaign', 120),
    'utm_term'         => field('utm_term', 120),
    'utm_content'      => field('utm_content', 120),
    'gclid'            => field('gclid', 200),
    'fbclid'           => field('fbclid', 200),
    'timezone'         => field('timezone', 60),
];

$names = ['cabana' => 'Cabana', 'azoria' => 'Azoria', 'kartika' => 'Kartika', 'kartika-extended' => 'Kartika Extended'];
if ($lead['residence'] === '' && isset($names[$lead['residence_id']])) $lead['residence'] = $names[$lead['residence_id']];
if ($lead['residence_id'] !== '' && !isset($names[$lead['residence_id']])) $lead['residence_id'] = '';

/* ---------- check it ---------- */
$errors = [];
if ($lead['first_name'] === '') $errors['first_name'] = 'Please add your first name.';
if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please check the email address.';
if ($lead['phone'] !== '' && preg_match_all('/\d/', $lead['phone']) < 7) $errors['phone'] = 'Please check the number, including the country code.';
foreach (['check_in', 'check_out'] as $d) {
    if ($lead[$d] !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $lead[$d])) $errors[$d] = 'Please check the date.';
}
if ($lead['check_in'] !== '' && $lead['check_out'] !== '' && $lead['check_out'] <= $lead['check_in']) {
    $errors['check_out'] = 'Departure must be after arrival.';
}
if ($type === 'booking_request' && ($lead['residence_id'] === '' || $lead['check_in'] === '' || $lead['check_out'] === '')) {
    $errors['booking'] = 'Please choose a residence and dates.';
}
if ($errors) {
    respond(false, 422, 'Please check the highlighted fields.', $wantsJson, $errors);
}

/* ---------- rate limit: a few sends per visitor every 10 minutes ---------- */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$bucket = sys_get_temp_dir() . '/amz_lead_' . hash('sha256', $ip . '|amazona');
$now = time();
$hits = is_file($bucket) ? array_filter(array_map('intval', explode(',', (string) file_get_contents($bucket))), fn ($t) => $t > $now - 600) : [];
if (count($hits) >= (int) $config['rate_limit']) {
    respond(false, 429, 'Too many requests. Please try again in a few minutes.', $wantsJson);
}
$hits[] = $now;
@file_put_contents($bucket, implode(',', $hits), LOCK_EX);

/* ---------- forward to Zapier ---------- */
$hook = trim((string) $config['zapier_hook']);
if ($hook === '' || !preg_match('#^https://hooks\.zapier\.com/#', $hook) && !getenv('AMZ_ALLOW_ANY_HOOK')) {
    error_log('Amazona lead form: Zapier hook URL is not configured. Lead not forwarded: ' . json_encode($lead, JSON_UNESCAPED_UNICODE));
    respond(false, 503, 'The form is not connected yet.', $wantsJson);
}

$types = ['register_interest' => 'Register interest', 'booking_request' => 'Booking request'];
$payload = $lead + [
    'full_name'   => trim($lead['first_name'] . ' ' . $lead['last_name']),
    'source'      => 'Amazona website',
    'tags'        => 'Amazona website, ' . $types[$type],
    'received_at' => gmdate('c'),
    'ip'          => $ip,
    'user_agent'  => mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
];

$ch = curl_init($hook);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => 12,
]);
$body = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($code < 200 || $code >= 300) {
    // Keep the lead in the server's error log so it isn't lost.
    error_log("Amazona lead form: Zapier returned $code $err. Lead: " . json_encode($payload, JSON_UNESCAPED_UNICODE));
    respond(false, 502, 'We could not send your details just now.', $wantsJson);
}

respond(true, 200, 'Thank you.', $wantsJson);
