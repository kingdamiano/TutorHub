<?php

function request(string $method, string $url, array $headers = [], $data = null): array {
    $options = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers) . "\r\n",
            'ignore_errors' => true,
        ],
    ];

    if ($data !== null) {
        $options['http']['content'] = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $hasContentType = false;
        foreach ($headers as $header) {
            if (str_starts_with(strtolower($header), 'content-type:')) {
                $hasContentType = true;
                break;
            }
        }
        if (!$hasContentType) {
            $options['http']['header'] .= "Content-Type: application/json\r\n";
        }
    }

    $context = stream_context_create($options);
    $body = @file_get_contents($url, false, $context);
    $status = null;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $header) {
            if (preg_match('#HTTP/.*\s(\d+)#', $header, $matches)) {
                $status = (int)$matches[1];
                break;
            }
        }
    }

    return [$status, $body, $http_response_header ?? []];
}

function dumpResult(string $label, array $result): void {
    [$status, $body] = $result;
    echo "=== $label ===\n";
    echo "status: $status\n";
    echo "body: $body\n\n";
}

$base = 'http://127.0.0.1:8000';
$email = 'tutor_bugfix_test_' . time() . '@example.com';
$password = 'password123';

[$status, $body] = request('POST', "$base/api/register", [
    'Accept: application/json',
    'Content-Type: application/json',
], [
    'email' => $email,
    'password' => $password,
    'role' => 'tutor',
]);
dumpResult('REGISTER', [$status, $body]);
if ($status !== 201 && $status !== 409) {
    echo "Register failed, aborting.\n";
    exit(1);
}

[$status, $body] = request('POST', "$base/api/login", [
    'Accept: application/json',
    'Content-Type: application/json',
], [
    'email' => $email,
    'password' => $password,
]);
dumpResult('LOGIN', [$status, $body]);
if ($status !== 200) {
    echo "Login failed, aborting.\n";
    exit(1);
}
$json = json_decode($body, true);
$token = $json['token'] ?? null;
if (!$token) {
    echo "No token returned.\n";
    exit(1);
}

[$status, $body] = request('GET', "$base/api/me", [
    'Accept: application/json',
    'Authorization: Bearer ' . $token,
]);
dumpResult('ME', [$status, $body]);
$me = json_decode($body, true);
if (!isset($me['id'])) {
    echo "ME response missing id.\n";
    exit(1);
}

[$status, $body] = request('GET', "$base/api/users/{$me['id']}", [
    'Accept: application/ld+json',
    'Authorization: Bearer ' . $token,
]);
dumpResult('USER', [$status, $body]);
$user = json_decode($body, true);
$tp = $user['tutorProfile'] ?? null;
$tpIri = null;
if (is_string($tp)) {
    $tpIri = $tp;
} elseif (is_array($tp) && isset($tp['@id'])) {
    $tpIri = $tp['@id'];
}

if (!$tpIri) {
    [$status, $body] = request('POST', "$base/api/tutor_profiles", [
        'Accept: application/ld+json',
        'Content-Type: application/ld+json',
        'Authorization: Bearer ' . $token,
    ], [
        'user' => "/api/users/{$me['id']}",
        'bio' => 'Test tutor',
        'city' => 'Test',
        'pricePerHour' => '100',
        'subjects' => [],
        'isApproved' => false,
    ]);
    dumpResult('CREATE_TUTOR_PROFILE', [$status, $body]);
    if ($status !== 201) {
        echo "Failed to create tutor profile.\n";
        exit(1);
    }
    $created = json_decode($body, true);
    $tpIri = $created['@id'] ?? null;
}

if (!$tpIri) {
    echo "Tutor profile IRI is missing.\n";
    exit(1);
}
echo "TutorProfile IRI: $tpIri\n\n";

function postSlot(string $label, int $dayOfWeek, string $start, string $end) {
    global $base, $token, $tpIri;
    [$status, $body] = request('POST', "$base/api/availabilities", [
        'Accept: application/ld+json',
        'Content-Type: application/ld+json',
        'Authorization: Bearer ' . $token,
    ], [
        'tutorProfile' => $tpIri,
        'dayOfWeek' => $dayOfWeek,
        'startTime' => $start,
        'endTime' => $end,
    ]);
    dumpResult("$label (day $dayOfWeek)", [$status, $body]);
}

echo "=== Scenario 1: day 1 base + 09:00-09:59 should succeed ===\n";
postSlot('BASE_10_14', 1, '10:00:00', '14:00:00');
postSlot('TEST_9_59', 1, '09:00:00', '09:59:00');

echo "=== Scenario 2: day 2 base + 09:00-10:00 should succeed ===\n";
postSlot('BASE_10_14', 2, '10:00:00', '14:00:00');
postSlot('TEST_9_10', 2, '09:00:00', '10:00:00');

echo "=== Scenario 3: day 3 base + 11:00-12:00 should fail ===\n";
postSlot('BASE_10_14', 3, '10:00:00', '14:00:00');
postSlot('TEST_11_12', 3, '11:00:00', '12:00:00');
