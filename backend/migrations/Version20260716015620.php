<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260716015620 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tutor_profile ADD COLUMN rejected BOOLEAN DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__tutor_profile AS SELECT id, user_id, bio, city, price_per_hour, photo, rating, is_approved FROM tutor_profile');
        $this->addSql('DROP TABLE tutor_profile');
        $this->addSql('CREATE TABLE tutor_profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, bio CLOB DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, price_per_hour NUMERIC(8, 2) NOT NULL, photo VARCHAR(255) DEFAULT NULL, rating NUMERIC(3, 2) DEFAULT NULL, is_approved BOOLEAN DEFAULT 0 NOT NULL, CONSTRAINT FK_E9AFA7B0A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tutor_profile (id, user_id, bio, city, price_per_hour, photo, rating, is_approved) SELECT id, user_id, bio, city, price_per_hour, photo, rating, is_approved FROM __temp__tutor_profile');
        $this->addSql('DROP TABLE __temp__tutor_profile');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_E9AFA7B0A76ED395 ON tutor_profile (user_id)');
    }
}
