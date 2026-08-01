<?php

namespace App\EventSubscriber;

use App\Entity\TutorProfile;
use App\Service\TutorProfileModerationService;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Events;

class TutorProfileModerationSubscriber implements EventSubscriber
{
    public function __construct(private readonly TutorProfileModerationService $moderationService)
    {
    }

    public function getSubscribedEvents(): array
    {
        return [Events::preUpdate];
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof TutorProfile) {
            return;
        }

        $changeSet = $args->getEntityChangeSet();
        if ($this->moderationService->shouldResetApproval($changeSet)) {
            $entity->setIsApproved(false);
        }
    }
}
