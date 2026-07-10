<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260710001746 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE subject_tutor_profile (subject_id INTEGER NOT NULL, tutor_profile_id INTEGER NOT NULL, PRIMARY KEY(subject_id, tutor_profile_id), CONSTRAINT FK_904F84F923EDC87 FOREIGN KEY (subject_id) REFERENCES subject (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_904F84F9430AF9E FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_904F84F923EDC87 ON subject_tutor_profile (subject_id)');
        $this->addSql('CREATE INDEX IDX_904F84F9430AF9E ON subject_tutor_profile (tutor_profile_id)');
        $this->addSql('DROP TABLE tutor_profile_subject');
        $this->addSql('CREATE TEMPORARY TABLE __temp__availability AS SELECT id, tutor_profile_id, day_of_week, start_time, end_time FROM availability');
        $this->addSql('DROP TABLE availability');
        $this->addSql('CREATE TABLE availability (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tutor_profile_id INTEGER NOT NULL, day_of_week SMALLINT NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, CONSTRAINT FK_3FB7A2BF430AF9E FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO availability (id, tutor_profile_id, day_of_week, start_time, end_time) SELECT id, tutor_profile_id, day_of_week, start_time, end_time FROM __temp__availability');
        $this->addSql('DROP TABLE __temp__availability');
        $this->addSql('CREATE INDEX IDX_3FB7A2BF430AF9E ON availability (tutor_profile_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__booking AS SELECT id, student_id, tutor_profile_id, subject_id, start_at, duration_minutes, status, created_at FROM booking');
        $this->addSql('DROP TABLE booking');
        $this->addSql('CREATE TABLE booking (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, student_id INTEGER NOT NULL, tutor_profile_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, start_at DATETIME NOT NULL, duration_minutes INTEGER NOT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, CONSTRAINT FK_E00CEDDECB944F1A FOREIGN KEY (student_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_E00CEDDE430AF9E FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_E00CEDDE23EDC87 FOREIGN KEY (subject_id) REFERENCES subject (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO booking (id, student_id, tutor_profile_id, subject_id, start_at, duration_minutes, status, created_at) SELECT id, student_id, tutor_profile_id, subject_id, start_at, duration_minutes, status, created_at FROM __temp__booking');
        $this->addSql('DROP TABLE __temp__booking');
        $this->addSql('CREATE INDEX IDX_E00CEDDECB944F1A ON booking (student_id)');
        $this->addSql('CREATE INDEX IDX_E00CEDDE430AF9E ON booking (tutor_profile_id)');
        $this->addSql('CREATE INDEX IDX_E00CEDDE23EDC87 ON booking (subject_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__review AS SELECT id, booking_id, rating, comment, created_at FROM review');
        $this->addSql('DROP TABLE review');
        $this->addSql('CREATE TABLE review (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, booking_id INTEGER NOT NULL, rating SMALLINT NOT NULL, comment CLOB DEFAULT NULL, created_at DATETIME NOT NULL, CONSTRAINT FK_794381C63301C60 FOREIGN KEY (booking_id) REFERENCES booking (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO review (id, booking_id, rating, comment, created_at) SELECT id, booking_id, rating, comment, created_at FROM __temp__review');
        $this->addSql('DROP TABLE __temp__review');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_794381C63301C60 ON review (booking_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__subject AS SELECT id, name, slug FROM subject');
        $this->addSql('DROP TABLE subject');
        $this->addSql('CREATE TABLE subject (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL)');
        $this->addSql('INSERT INTO subject (id, name, slug) SELECT id, name, slug FROM __temp__subject');
        $this->addSql('DROP TABLE __temp__subject');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_FBCE3E7A989D9B62 ON subject (slug)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tutor_profile AS SELECT id, user_id, bio, city, price_per_hour, photo, rating, is_approved FROM tutor_profile');
        $this->addSql('DROP TABLE tutor_profile');
        $this->addSql('CREATE TABLE tutor_profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, bio CLOB DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, price_per_hour NUMERIC(8, 2) NOT NULL, photo VARCHAR(255) DEFAULT NULL, rating NUMERIC(3, 2) DEFAULT NULL, is_approved BOOLEAN DEFAULT 0 NOT NULL, CONSTRAINT FK_E9AFA7B0A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tutor_profile (id, user_id, bio, city, price_per_hour, photo, rating, is_approved) SELECT id, user_id, bio, city, price_per_hour, photo, rating, is_approved FROM __temp__tutor_profile');
        $this->addSql('DROP TABLE __temp__tutor_profile');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_E9AFA7B0A76ED395 ON tutor_profile (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, email, roles, password, created_at FROM user');
        $this->addSql('DROP TABLE user');
        $this->addSql('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles CLOB NOT NULL --(DC2Type:json)
        , password VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        )');
        $this->addSql('INSERT INTO user (id, email, roles, password, created_at) SELECT id, email, roles, password, created_at FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON user (email)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tutor_profile_subject (tutor_profile_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, PRIMARY KEY(tutor_profile_id, subject_id), FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, FOREIGN KEY (subject_id) REFERENCES subject (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_96E5E8F423EDC87 ON tutor_profile_subject (subject_id)');
        $this->addSql('CREATE INDEX IDX_96E5E8F4A0E16308 ON tutor_profile_subject (tutor_profile_id)');
        $this->addSql('DROP TABLE subject_tutor_profile');
        $this->addSql('CREATE TEMPORARY TABLE __temp__availability AS SELECT id, tutor_profile_id, day_of_week, start_time, end_time FROM availability');
        $this->addSql('DROP TABLE availability');
        $this->addSql('CREATE TABLE availability (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tutor_profile_id INTEGER NOT NULL, day_of_week SMALLINT NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO availability (id, tutor_profile_id, day_of_week, start_time, end_time) SELECT id, tutor_profile_id, day_of_week, start_time, end_time FROM __temp__availability');
        $this->addSql('DROP TABLE __temp__availability');
        $this->addSql('CREATE INDEX IDX_2D521220A0E16308 ON availability (tutor_profile_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__booking AS SELECT id, student_id, tutor_profile_id, subject_id, start_at, duration_minutes, status, created_at FROM booking');
        $this->addSql('DROP TABLE booking');
        $this->addSql('CREATE TABLE booking (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, student_id INTEGER NOT NULL, tutor_profile_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, start_at DATETIME NOT NULL, duration_minutes INTEGER NOT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, FOREIGN KEY (student_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, FOREIGN KEY (subject_id) REFERENCES subject (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO booking (id, student_id, tutor_profile_id, subject_id, start_at, duration_minutes, status, created_at) SELECT id, student_id, tutor_profile_id, subject_id, start_at, duration_minutes, status, created_at FROM __temp__booking');
        $this->addSql('DROP TABLE __temp__booking');
        $this->addSql('CREATE INDEX IDX_3801B32723EDC87 ON booking (subject_id)');
        $this->addSql('CREATE INDEX IDX_3801B327A0E16308 ON booking (tutor_profile_id)');
        $this->addSql('CREATE INDEX IDX_3801B327CB944F1A ON booking (student_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__review AS SELECT id, booking_id, rating, comment, created_at FROM review');
        $this->addSql('DROP TABLE review');
        $this->addSql('CREATE TABLE review (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, booking_id INTEGER NOT NULL, rating SMALLINT NOT NULL, comment CLOB DEFAULT NULL, created_at DATETIME NOT NULL, FOREIGN KEY (booking_id) REFERENCES booking (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO review (id, booking_id, rating, comment, created_at) SELECT id, booking_id, rating, comment, created_at FROM __temp__review');
        $this->addSql('DROP TABLE __temp__review');
        $this->addSql('CREATE INDEX UNIQ_794381C63301C6F7 ON review (booking_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__subject AS SELECT id, name, slug FROM subject');
        $this->addSql('DROP TABLE subject');
        $this->addSql('CREATE TABLE subject (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL)');
        $this->addSql('INSERT INTO subject (id, name, slug) SELECT id, name, slug FROM __temp__subject');
        $this->addSql('DROP TABLE __temp__subject');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_FBCE3B7A989D9B62 ON subject (slug)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tutor_profile AS SELECT id, user_id, bio, city, price_per_hour, photo, rating, is_approved FROM tutor_profile');
        $this->addSql('DROP TABLE tutor_profile');
        $this->addSql('CREATE TABLE tutor_profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, bio CLOB DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, price_per_hour NUMERIC(8, 2) NOT NULL, photo VARCHAR(255) DEFAULT NULL, rating NUMERIC(3, 2) DEFAULT NULL, is_approved BOOLEAN DEFAULT 0 NOT NULL, FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tutor_profile (id, user_id, bio, city, price_per_hour, photo, rating, is_approved) SELECT id, user_id, bio, city, price_per_hour, photo, rating, is_approved FROM __temp__tutor_profile');
        $this->addSql('DROP TABLE __temp__tutor_profile');
        $this->addSql('CREATE INDEX UNIQ_2F6D8B8A76ED395 ON tutor_profile (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, email, roles, password, created_at FROM "user"');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('CREATE TABLE "user" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles CLOB NOT NULL --(DC2Type:json)
        , password VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO "user" (id, email, roles, password, created_at) SELECT id, email, roles, password, created_at FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL ON "user" (email)');
    }
}
