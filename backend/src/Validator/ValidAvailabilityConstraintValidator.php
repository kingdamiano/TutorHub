<?php

namespace App\Validator;

use App\Entity\Availability;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidAvailabilityConstraintValidator extends ConstraintValidator
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidAvailabilityConstraint) {
            throw new UnexpectedTypeException($constraint, ValidAvailabilityConstraint::class);
        }

        if (!$value instanceof Availability) {
            throw new UnexpectedTypeException($value, Availability::class);
        }

        $startTime = $value->getStartTime();
        $endTime = $value->getEndTime();

        if ($startTime && $endTime && $this->secondsSinceMidnight($startTime) >= $this->secondsSinceMidnight($endTime)) {
            $this->context->buildViolation('Start time must be earlier than end time')
                ->addViolation();
            return;
        }

        $tutorProfile = $value->getTutorProfile();
        if (!$tutorProfile) {
            return;
        }

        $dayOfWeek = $value->getDayOfWeek();
        if ($dayOfWeek === null) {
            return;
        }

        $existingSlots = $this->entityManager->getRepository(Availability::class)->findBy([
            'tutorProfile' => $tutorProfile,
            'dayOfWeek' => $dayOfWeek,
        ]);

        $currentId = $value->getId();

        foreach ($existingSlots as $slot) {
            if ($slot->getId() === $currentId) {
                continue;
            }

            if ($this->rangesOverlap($value, $slot)) {
                $this->context->buildViolation('This time range overlaps with an existing availability slot for the same tutor and day')
                    ->addViolation();
                return;
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
