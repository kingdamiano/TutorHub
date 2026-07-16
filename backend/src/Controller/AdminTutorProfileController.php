<?php
namespace App\Controller;

use App\Entity\TutorProfile;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class AdminTutorProfileController extends AbstractController
{
    #[Route('/api/tutor_profiles/{id}/approve', name: 'api_tutor_profile_admin_approve', methods: ['PATCH'])]
    public function approve(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $repo = $em->getRepository(TutorProfile::class);
        $tp = $repo->find($id);
        if (!$tp) {
            return $this->json(['code' => 404, 'message' => 'Not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || (!array_key_exists('isApproved', $data) && !array_key_exists('rejected', $data))) {
            return $this->json(['code' => 400, 'message' => 'Missing isApproved or rejected field'], 400);
        }

        if (array_key_exists('isApproved', $data)) {
            $tp->setIsApproved((bool)$data['isApproved']);
            if ($tp->isApproved()) {
                $tp->setRejected(false);
            }
        }

        if (array_key_exists('rejected', $data)) {
            $tp->setRejected((bool)$data['rejected']);
            if ($tp->isRejected()) {
                $tp->setIsApproved(false);
            }
        }

        $em->persist($tp);
        $em->flush();

        return $this->json([
            '@id' => '/api/tutor_profiles/' . $tp->getId(),
            'id' => $tp->getId(),
            'user' => '/api/users/' . $tp->getUser()->getId(),
            'bio' => $tp->getBio(),
            'city' => $tp->getCity(),
            'pricePerHour' => $tp->getPricePerHour(),
            'isApproved' => $tp->isApproved(),
            'rejected' => $tp->isRejected(),
        ]);
    }
}
