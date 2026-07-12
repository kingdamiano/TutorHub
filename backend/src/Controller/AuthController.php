<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class AuthController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $tokenManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json([
                'code' => 400,
                'message' => 'Missing email or password'
            ], 400);
        }

        $user = $em->getRepository(User::class)->findOneBy(['email' => $data['email']]);

        if (!$user || !$passwordHasher->isPasswordValid($user, $data['password'])) {
            return $this->json([
                'code' => 401,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $tokenManager->create($user);

        return $this->json([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles()
            ]
        ]);
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $tokenManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json([
                'code' => 400,
                'message' => 'Missing email or password'
            ], 400);
        }

        if (!isset($data['role']) || !in_array($data['role'], ['student', 'tutor'])) {
            return $this->json([
                'code' => 400,
                'message' => 'Invalid or missing role. Must be "student" or "tutor"'
            ], 400);
        }

        if (!is_string($data['password']) || strlen($data['password']) < 8) {
            return $this->json([
                'code' => 422,
                'message' => 'Password must be at least 8 characters long'
            ], 422);
        }

        $existingUser = $em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return $this->json([
                'code' => 409,
                'message' => 'User with this email already exists'
            ], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setPassword($passwordHasher->hashPassword($user, $data['password']));

        $role = $data['role'] === 'tutor' ? 'ROLE_TUTOR' : 'ROLE_STUDENT';
        $user->setRoles([$role]);

        // Validate the user entity
        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getPropertyPath() . ': ' . $error->getMessage();
            }
            return $this->json([
                'code' => 422,
                'message' => 'Validation failed',
                'errors' => $errorMessages
            ], 422);
        }

        $em->persist($user);
        $em->flush();

        $token = $tokenManager->create($user);

        return $this->json([
            'code' => 201,
            'message' => 'User registered successfully',
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles()
            ]
        ], 201);
    }
}
