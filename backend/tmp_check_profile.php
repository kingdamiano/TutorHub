<?php
$pdo = new PDO('sqlite:var/app.db');
$row = $pdo->query('SELECT id FROM tutor_profile ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo "NO_PROFILE\n";
    exit(0);
}
echo $row['id'] . "\n";
