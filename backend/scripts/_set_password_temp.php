<?php
 $db = new PDO('sqlite:' . __DIR__ . '/../var/app.db');
$pw = password_hash('password123', PASSWORD_BCRYPT);
$stmt = $db->prepare('UPDATE user SET password = :pw WHERE email = :email');
$stmt->execute([':pw' => $pw, ':email' => 'tutor2@example.com']);
echo 'updated ' . $stmt->rowCount() . "\n";
