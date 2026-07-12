<?php

namespace App\Validator;

use App\Entity\Review;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidReviewConstraintValidator extends ConstraintValidator
{
    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidReviewConstraint) {
            throw new UnexpectedTypeException($constraint, ValidReviewConstraint::class);
        }

        if (!$value instanceof Review) {
            throw new UnexpectedTypeException($value, Review::class);
        }

        $booking = $value->getBooking();

        // Check if booking exists
        if (!$booking) {
            $this->context->buildViolation('Booking is required')
                ->addViolation();
            return;
        }

        // Check if booking is completed
        if ($booking->getStatus()->value !== 'completed') {
            $this->context->buildViolation('Review can only be created for completed bookings')
                ->addViolation();
            return;
        }

        // Check if review already exists for this booking
        if ($booking->getReview() !== null) {
            $this->context->buildViolation('A review already exists for this booking')
                ->addViolation();
            return;
        }
    }
}
