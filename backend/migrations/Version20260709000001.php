<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260709000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create initial schema with User, TutorProfile, Subject, Availability, Booking, and Review tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE "user" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL ON "user" (email)');

        $this->addSql('CREATE TABLE subject (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_FBCE3B7A989D9B62 ON subject (slug)');

        $this->addSql('CREATE TABLE tutor_profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL UNIQUE, bio TEXT DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, price_per_hour NUMERIC(8, 2) NOT NULL, photo VARCHAR(255) DEFAULT NULL, rating NUMERIC(3, 2) DEFAULT NULL, is_approved BOOLEAN NOT NULL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX UNIQ_2F6D8B8A76ED395 ON tutor_profile (user_id)');

        $this->addSql('CREATE TABLE tutor_profile_subject (tutor_profile_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, PRIMARY KEY(tutor_profile_id, subject_id), FOREIGN KEY(tutor_profile_id) REFERENCES tutor_profile(id) ON DELETE CASCADE, FOREIGN KEY(subject_id) REFERENCES subject(id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_96E5E8F4A0E16308 ON tutor_profile_subject (tutor_profile_id)');
        $this->addSql('CREATE INDEX IDX_96E5E8F423EDC87 ON tutor_profile_subject (subject_id)');

        $this->addSql('CREATE TABLE availability (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tutor_profile_id INTEGER NOT NULL, day_of_week SMALLINT NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, FOREIGN KEY(tutor_profile_id) REFERENCES tutor_profile(id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_2D521220A0E16308 ON availability (tutor_profile_id)');

        $this->addSql('CREATE TABLE booking (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, student_id INTEGER NOT NULL, tutor_profile_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, start_at DATETIME NOT NULL, duration_minutes INTEGER NOT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, FOREIGN KEY(student_id) REFERENCES "user"(id) ON DELETE CASCADE, FOREIGN KEY(tutor_profile_id) REFERENCES tutor_profile(id) ON DELETE CASCADE, FOREIGN KEY(subject_id) REFERENCES subject(id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_3801B327CB944F1A ON booking (student_id)');
        $this->addSql('CREATE INDEX IDX_3801B327A0E16308 ON booking (tutor_profile_id)');
        $this->addSql('CREATE INDEX IDX_3801B32723EDC87 ON booking (subject_id)');

        $this->addSql('CREATE TABLE review (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, booking_id INTEGER NOT NULL UNIQUE, rating SMALLINT NOT NULL, comment TEXT DEFAULT NULL, created_at DATETIME NOT NULL, FOREIGN KEY(booking_id) REFERENCES booking(id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX UNIQ_794381C63301C6F7 ON review (booking_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE review');
        $this->addSql('DROP TABLE booking');
        $this->addSql('DROP TABLE availability');
        $this->addSql('DROP TABLE tutor_profile_subject');
        $this->addSql('DROP TABLE tutor_profile');
        $this->addSql('DROP TABLE subject');
        $this->addSql('DROP TABLE "user"');
    }
}
