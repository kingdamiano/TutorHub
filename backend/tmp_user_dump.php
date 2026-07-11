<?php
$pdo = new PDO('sqlite:var/app.db');
foreach ($pdo->query('SELECT id,email,password,roles FROM "user"') as $row) {
    echo $row['id'] . '|' . $row['email'] . '|' . $row['password'] . '|' . $row['roles'] . PHP_EOL;
}
