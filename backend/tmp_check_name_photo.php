<?php
$pdo = new PDO('sqlite:var/app.db');
$rows = $pdo->query('SELECT id, name, photo FROM tutor_profile WHERE name IS NOT NULL OR photo IS NOT NULL ORDER BY id LIMIT 5');
foreach ($rows as $row) {
    echo $row['id'] . '|' . ($row['name'] ?? '') . '|' . ($row['photo'] ?? '') . PHP_EOL;
}
