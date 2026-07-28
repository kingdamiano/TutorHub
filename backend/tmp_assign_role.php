<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/var/app.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->prepare('SELECT id, email, roles FROM "user" WHERE email = :email');
$stmt->execute([':email' => 'test@example.com']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "missing\n";
    exit(1);
}

$updatedRoles = '["ROLE_TUTOR"]';
$update = $pdo->prepare('UPDATE "user" SET roles = :roles WHERE email = :email');
$update->execute([':roles' => $updatedRoles, ':email' => 'test@example.com']);

$stmt = $pdo->prepare('SELECT id, email, roles FROM "user" WHERE email = :email');
$stmt->execute([':email' => 'test@example.com']);
$updated = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($updated, JSON_UNESCAPED_UNICODE) . PHP_EOL;
