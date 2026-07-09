<?php

require_once 'vendor/autoload.php';

use App\Entity\User;
use Doctrine\ORM\EntityManager;
use Symfony\Component\PasswordHasher\Hasher\Argon2idPasswordHasher;

// Setup Doctrine
$dotenv = \Symfony\Component\Dotenv\Dotenv::class;
if (class_exists($dotenv)) {
    (new $dotenv())->loadEnv('.env');
}

$entityManagerFactory = new class {
    public static function create()
    {
        $config = \Doctrine\ORM\ORMSetup::createAttributeMetadataConfiguration(
            paths: [__DIR__ . '/src'],
            isDevMode: true,
        );

        $connection = \Doctrine\DBAL\DriverManager::getConnection(
            [
                'driver' => 'pdo_sqlite',
                'path' => __DIR__ . '/var/app.db',
            ],
            $config
        );

        return new EntityManager($connection, $config);
    }
};

$em = $entityManagerFactory::create();
$hasher = new Argon2idPasswordHasher();

// Create test user
$user = new User();
$user->setEmail('test@example.com');
$user->setPassword($hasher->hash('password123'));
$user->setRoles(['ROLE_USER']);

$em->persist($user);
$em->flush();

echo "✓ User created: test@example.com\n";
echo "✓ Password: password123\n";
echo "\nNow you can login with:\n";
echo "POST /api/login\n";
echo "{\n";
echo "  \"email\": \"test@example.com\",\n";
echo "  \"password\": \"password123\"\n";
echo "}\n";
