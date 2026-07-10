<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260710010506 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tutor_profile_subject (tutor_profile_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, PRIMARY KEY(tutor_profile_id, subject_id), CONSTRAINT FK_16F2E2D5430AF9E FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_16F2E2D523EDC87 FOREIGN KEY (subject_id) REFERENCES subject (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_16F2E2D5430AF9E ON tutor_profile_subject (tutor_profile_id)');
        $this->addSql('CREATE INDEX IDX_16F2E2D523EDC87 ON tutor_profile_subject (subject_id)');
        $this->addSql('DROP TABLE subject_tutor_profile');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE subject_tutor_profile (subject_id INTEGER NOT NULL, tutor_profile_id INTEGER NOT NULL, PRIMARY KEY(subject_id, tutor_profile_id), CONSTRAINT FK_904F84F923EDC87 FOREIGN KEY (subject_id) REFERENCES subject (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_904F84F9430AF9E FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profile (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_904F84F9430AF9E ON subject_tutor_profile (tutor_profile_id)');
        $this->addSql('CREATE INDEX IDX_904F84F923EDC87 ON subject_tutor_profile (subject_id)');
        $this->addSql('DROP TABLE tutor_profile_subject');
    }
}
