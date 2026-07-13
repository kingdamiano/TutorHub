<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Availability;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class AvailabilityProcessor implements ProcessorInterface
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Availability) {
            return $data;
        }

        if ($operation->getMethod() === 'DELETE') {
            $this->entityManager->remove($data);
            $this->entityManager->flush();
            return null;
        }

        $this->assertTimeRange($data);
        $this->assertNoOverlap($data);

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    private function assertTimeRange(Availability $availability): void
    {
        $startTime = $availability->getStartTime();
        $endTime = $availability->getEndTime();

        if ($startTime && $endTime && $this->secondsSinceMidnight($startTime) >= $this->secondsSinceMidnight($endTime)) {
            throw new UnprocessableEntityHttpException('Start time must be earlier than end time');
        }
    }

    private function assertNoOverlap(Availability $availability): void
    {
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

        return $this->secondsSinceMidnight($newStart) < $this->secondsSinceMidnight($existingEnd)
            && $this->secondsSinceMidnight($existingStart) < $this->secondsSinceMidnight($newEnd);
    }

    private function secondsSinceMidnight(\DateTimeInterface $time): int
    {
        return ((int) $time->format('H') * 3600)
            + ((int) $time->format('i') * 60)
            + (int) $time->format('s');
    }
}
