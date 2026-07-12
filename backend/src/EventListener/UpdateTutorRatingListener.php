<?php

namespace App\EventListener;

use App\Entity\Review;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;

class UpdateTutorRatingListener
{
    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Review) {
            return;
        }

        $this->updateTutorRating($entity, $args);
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Review) {
            return;
        }

        $this->updateTutorRating($entity, $args);
    }

    public function postRemove(PostRemoveEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Review) {
            return;
        }

        $this->updateTutorRating($entity, $args);
    }

    private function updateTutorRating($review, $args): void
    {
        $booking = $review->getBooking();
        if (!$booking) {
            return;
        }

        $tutorProfile = $booking->getTutorProfile();
        if (!$tutorProfile) {
            return;
        }

        $em = $args->getObjectManager();

        // Get all reviews for this tutor's bookings
        $dql = 'SELECT AVG(r.rating) as avg_rating FROM App\Entity\Review r 
                JOIN r.booking b 
                WHERE b.tutorProfile = :tutorProfile';

        $query = $em->createQuery($dql);
        $query->setParameter('tutorProfile', $tutorProfile);

        $result = $query->getOneOrNullResult();
        $avgRating = $result['avg_rating'] ?? null;

        if ($avgRating !== null) {
            $tutorProfile->setRating((float)$avgRating);
        } else {
            $tutorProfile->setRating(null);
        }

        $em->persist($tutorProfile);
        $em->flush();
    }
}
