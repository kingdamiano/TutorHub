<?php
namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AdminPatchGuardSubscriber implements EventSubscriberInterface
{
    private AuthorizationCheckerInterface $auth;

    public function __construct(AuthorizationCheckerInterface $auth)
    {
        $this->auth = $auth;
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
        // Only guard API tutor_profiles PATCH endpoints
        if (strpos($path, '/api/tutor_profiles') !== 0) {
            return;
        }

        // If user is not admin, nothing to do
        if (!$this->auth->isGranted('ROLE_ADMIN')) {
            return;
        }

        // Read request body JSON and ensure only "isApproved" is being modified
        $content = $request->getContent();
        if (!$content) {
            // empty body — allow
            return;
        }

        $data = json_decode($content, true);
        if (!is_array($data)) {
            // non-json body — block for safety
            throw new AccessDeniedHttpException('Admins may only modify isApproved via PATCH');
        }

        $allowed = ['isApproved'];
        $keys = array_keys($data);
        foreach ($keys as $k) {
            if (!in_array($k, $allowed, true)) {
                throw new AccessDeniedHttpException('Admins may only modify isApproved via PATCH');
            }
        }
    }
}
