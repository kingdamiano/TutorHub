<?php

namespace App\EventListener;

use App\Entity\Availability;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class AvailabilityValidationListener
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    public function prePersist(PrePersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Availability) {
            return;
        }

        $this->validateAvailability($entity);
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Availability) {
            return;
        }

        $this->validateAvailability($entity);
    }

    private function validateAvailability(Availability $availability): void
    {
        $startTime = $availability->getStartTime();
        $endTime = $availability->getEndTime();

        if ($startTime && $endTime && $startTime >= $endTime) {
            throw new UnprocessableEntityHttpException('Start time must be earlier than end time');
        }

        $dayOfWeek = $availability->getDayOfWeek();
        if ($dayOfWeek === null) {
            return;
        }

        if ($dayOfWeek < 0 || $dayOfWeek > 6) {
            throw new UnprocessableEntityHttpException('Day of week must be between 0 and 6');
        }

        $tutorProfile = $availability->getTutorProfile();
        if (!$tutorProfile) {
            return;
        }

        $existingSlots = $this->entityManager->getRepository(Availability::class)->findBy([
            'tutorProfile' => $tutorProfile,
            'dayOfWeek' => $dayOfWeek,
        ]);

        $currentId = $availability->getId();

        foreach ($existingSlots as $slot) {
            if ($slot->getId() === $currentId) {
                continue;
            }

            if ($this->rangesOverlap($availability, $slot)) {
                throw new UnprocessableEntityHttpException('This time range overlaps with an existing availability slot for the same tutor and day');
            }
        }
    }

    private function rangesOverlap(Availability $newSlot, Availability $existingSlot): bool
    {
        $newStart = $newSlot->getStartTime();
        $newEnd = $newSlot->getEndTime();
        $existingStart = $existingSlot->getStartTime();
        $existingEnd = $existingSlot->getEndTime();

        if (!$newStart || !$newEnd || !$existingStart || !$existingEnd) {
            return false;
        }

        $newStartSeconds = $this->secondsSinceMidnight($newStart);
        $newEndSeconds = $this->secondsSinceMidnight($newEnd);
        $existingStartSeconds = $this->secondsSinceMidnight($existingStart);
        $existingEndSeconds = $this->secondsSinceMidnight($existingEnd);

        return $newStartSeconds < $existingEndSeconds && $existingStartSeconds < $newEndSeconds;
    }

    private function secondsSinceMidnight(\DateTimeInterface $time): int
    {
        return ((int) $time->format('H') * 3600)
            + ((int) $time->format('i') * 60)
            + (int) $time->format('s');
    }
}
