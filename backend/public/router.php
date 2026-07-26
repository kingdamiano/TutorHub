<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$requested = __DIR__ . $uri;
if ($uri !== '/' && is_file($requested)) {
    // Let the built-in PHP server serve the requested resource directly
    return false;
}

// index.php returns a callable for the runtime; return it to the server
return require __DIR__ . '/index.php';
