<?php
function request(string $method, string $url, array $headers = [], ?string $body = null): array
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return ['status' => null, 'body' => '', 'error' => $error];
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $body = substr($response, $headerSize);
    curl_close($ch);
    return ['status' => $status, 'body' => $body, 'error' => null];
}

function login(string $email, string $password): array
{
    $payload = json_encode(['email' => $email, 'password' => $password], JSON_UNESCAPED_UNICODE);
    return request('POST', 'http://127.0.0.1:8000/api/login', [
        'Content-Type: application/json',
        'Accept: application/json',
    ], $payload);
}

function patch(string $url, string $token, array $data): array
{
    $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
    return request('PATCH', $url, [
        'Content-Type: application/merge-patch+json',
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ], $payload);
}

$tests = [];
$admin = login('admin_test@example.com', 'Password1234');
$tests[] = ['name' => 'ADMIN_LOGIN', 'result' => $admin];
$adminToken = null;
if ($admin['status'] === 200) {
    $json = json_decode($admin['body'], true);
    $adminToken = $json['token'] ?? null;
}

if ($adminToken) {
    $tests[] = ['name' => 'ADMIN_APPROVE', 'result' => patch('http://127.0.0.1:8000/api/tutor_profiles/5/approve', $adminToken, ['isApproved' => true])];
    $tests[] = ['name' => 'ADMIN_NORMAL_PATCH', 'result' => patch('http://127.0.0.1:8000/api/tutor_profiles/5', $adminToken, ['bio' => 'hacked-admin'])];
}

$tutor = login('tutor2@example.com', 'password123');
$tests[] = ['name' => 'TUTOR_LOGIN', 'result' => $tutor];
$tutorToken = null;
if ($tutor['status'] === 200) {
    $json = json_decode($tutor['body'], true);
    $tutorToken = $json['token'] ?? null;
}

if ($tutorToken) {
    $tests[] = ['name' => 'TUTOR_APPROVE', 'result' => patch('http://127.0.0.1:8000/api/tutor_profiles/5/approve', $tutorToken, ['isApproved' => true])];
}

foreach ($tests as $test) {
    echo $test['name'] . "\n";
    echo "status: " . ($test['result']['status'] ?? 'null') . "\n";
    echo "error: " . ($test['result']['error'] ?? '') . "\n";
    echo "body: " . trim($test['result']['body']) . "\n";
    echo str_repeat('-', 40) . "\n";
}
