<?php
namespace App\EventSubscriber;

use App\Entity\TutorProfile;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class AdminPatchGuardSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly TokenStorageInterface $tokenStorage,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['onKernelView', 10],
        ];
    }

    public function onKernelView(ViewEvent $event): void
    {
        $request = $event->getRequest();

        if ($request->getMethod() !== 'PATCH') {
            return;
        }

        $path = $request->getPathInfo();
        if (strpos($path, '/api/tutor_profiles') !== 0) {
            return;
        }

        $token = $this->tokenStorage->getToken();
        $user = $token?->getUser();

        if (!$user instanceof User) {
            return;
        }

        $content = $request->getContent();
        if (!$content) {
            return;
        }

        $data = json_decode($content, true);
        if (!is_array($data)) {
            throw new AccessDeniedHttpException('Admins may only modify isApproved via PATCH');
        }

        $tutorProfile = $request->attributes->get('data');
        if (!$tutorProfile instanceof TutorProfile) {
            $id = $request->attributes->get('id');
            if ($id !== null && $id !== '') {
                $tutorProfile = $this->entityManager->getRepository(TutorProfile::class)->find((int) $id);
            }
        }

        if (!$tutorProfile instanceof TutorProfile) {
            return;
        }

        if (!$this->shouldEnforceAdminRestriction($user, $tutorProfile)) {
            return;
        }

        $allowed = ['isApproved'];
        $keys = array_keys($data);
        foreach ($keys as $k) {
            if (!in_array($k, $allowed, true)) {
                throw new AccessDeniedHttpException('Admins may only modify isApproved via PATCH');
            }
        }
    }

    public function shouldEnforceAdminRestriction(UserInterface $user, ?TutorProfile $tutorProfile): bool
    {
        if (!$user instanceof User) {
            return false;
        }

        if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return false;
        }

        if ($tutorProfile === null) {
            return true;
        }

        return $tutorProfile->getUser() !== $user;
    }
}
