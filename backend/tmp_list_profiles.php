<?php
$pdo = new PDO('sqlite:var/app.db');
$rows = $pdo->query('SELECT id, is_approved, user_id FROM tutor_profile ORDER BY id');
foreach ($rows as $row) {
    echo $row['id'] . '|' . $row['is_approved'] . '|' . $row['user_id'] . PHP_EOL;
}
