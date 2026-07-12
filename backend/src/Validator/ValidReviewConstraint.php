<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_CLASS)]
class ValidReviewConstraint extends Constraint
{
    public string $message = 'This review cannot be created';

    public function getTargets(): string
    {
        return 'class';
    }
}
