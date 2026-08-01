<?php

namespace App\Controller;

use App\Entity\TutorProfile;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[Route('/api/tutor_profiles/{id}/photo', name: 'api_tutor_profile_photo', methods: ['POST'])]
class TutorProfilePhotoController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public function __invoke(Request $request, int $id): JsonResponse
    {
        $user = $this->tokenStorage->getToken()?->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedHttpException('Only authenticated users can upload a tutor photo.');
        }

        $tutorProfile = $this->entityManager->getRepository(TutorProfile::class)->find($id);
        if (!$tutorProfile) {
            return new JsonResponse(['message' => 'Tutor profile not found'], 404);
        }

        if ($tutorProfile->getUser()?->getId() !== $user->getId()) {
            throw new AccessDeniedHttpException('Only the profile owner can upload a photo.');
        }

        $file = $request->files->get('file');
        if (!$file instanceof UploadedFile) {
            return new JsonResponse(['message' => 'Файл не найден'], 422);
        }

        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file->getClientMimeType(), $allowedMimeTypes, true)) {
            return new JsonResponse(['message' => 'Поддерживаются только JPEG, PNG и WebP'], 422);
        }

        if ($file->getSize() > 2 * 1024 * 1024) {
            return new JsonResponse(['message' => 'Файл слишком большой, максимум 2 МБ'], 422);
        }

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/tutor-photos';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $extension = strtolower(pathinfo($file->getClientOriginalName() ?: 'photo.jpg', PATHINFO_EXTENSION));
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $extension = 'jpg';
        }

        $currentPhoto = $tutorProfile->getPhoto();
        if ($currentPhoto && str_contains($currentPhoto, '/uploads/tutor-photos/')) {
            $oldFilePath = $this->getParameter('kernel.project_dir') . '/public' . $currentPhoto;
            if (is_file($oldFilePath)) {
                unlink($oldFilePath);
            }
        }

        $newFileName = $this->generateUuid() . '.' . $extension;
        $targetFilePath = $uploadDir . '/' . $newFileName;
        $file->move($uploadDir, $newFileName);

        $photoPath = '/uploads/tutor-photos/' . $newFileName;
        $tutorProfile->setPhoto($photoPath);
        $tutorProfile->setIsApproved(false);
        $this->entityManager->flush();

        return new JsonResponse(['photo' => $photoPath], 200);
    }

    private function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
