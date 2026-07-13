<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_CLASS)]
class ValidAvailabilityConstraint extends Constraint
{
    public string $message = 'This availability slot is invalid';

    public function getTargets(): string
    {
        return 'class';
    }
}
