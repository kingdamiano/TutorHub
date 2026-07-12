<?php

namespace App\Command;

use App\Entity\TutorProfile;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:tutor:recalc-ratings',
    description: 'Recalculate tutor ratings from reviews',
)]
class RecalcTutorRatingsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $tutorProfiles = $this->em->getRepository(TutorProfile::class)->findAll();

        foreach ($tutorProfiles as $tutorProfile) {
            // Get all reviews for this tutor's bookings
            $dql = 'SELECT AVG(r.rating) as avg_rating FROM App\Entity\Review r 
                    JOIN r.booking b 
                    WHERE b.tutorProfile = :tutorProfile';

            $query = $this->em->createQuery($dql);
            $query->setParameter('tutorProfile', $tutorProfile);

            $result = $query->getOneOrNullResult();
            $avgRating = $result['avg_rating'] ?? null;

            if ($avgRating !== null) {
                $tutorProfile->setRating((float)$avgRating);
                $output->writeln("TutorProfile {$tutorProfile->getId()}: Rating set to " . round($avgRating, 2));
            } else {
                $tutorProfile->setRating(null);
                $output->writeln("TutorProfile {$tutorProfile->getId()}: No reviews, rating set to NULL");
            }
        }

        $this->em->flush();
        $output->writeln("<info>Tutor ratings recalculated</info>");
        return Command::SUCCESS;
    }
}
