<?php

namespace App\ApiPlatform\Doctrine\Orm\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Booking;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final class BookingCollectionExtension implements QueryCollectionExtensionInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, Operation $operation = null, array $context = []): void
    {
        if (Booking::class !== $resourceClass) {
            return;
        }

        $user = $this->security->getUser();
        if (null === $user) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        $queryBuilder->leftJoin(sprintf('%s.tutorProfile', $rootAlias), 'tutorProfile');
        $queryBuilder->leftJoin('tutorProfile.user', 'tutorUser');
        $queryBuilder->andWhere(
            $queryBuilder->expr()->orX(
                $queryBuilder->expr()->eq(sprintf('%s.student', $rootAlias), ':current_user'),
                $queryBuilder->expr()->eq('tutorUser', ':current_user')
            )
        );
        $queryBuilder->setParameter('current_user', $user);
    }
}
