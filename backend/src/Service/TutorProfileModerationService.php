<?php

namespace App\Service;

class TutorProfileModerationService
{
    /**
     * Returns true when one of the moderation-sensitive fields changed.
     *
     * Sensitive fields: name, bio, photo.
     * Non-sensitive fields: subjects, city, pricePerHour.
     */
    public function shouldResetApproval(array $changeSet): bool
    {
        $sensitiveFields = ['name', 'bio', 'photo'];

        foreach ($sensitiveFields as $field) {
            if (!array_key_exists($field, $changeSet)) {
                continue;
            }

            $oldValue = $changeSet[$field][0] ?? null;
            $newValue = $changeSet[$field][1] ?? null;

            if ($oldValue !== $newValue) {
                return true;
            }
        }

        return false;
    }
}
