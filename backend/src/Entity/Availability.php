<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\State\AvailabilityProcessor;
use App\Validator\ValidAvailabilityConstraint;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ApiResource(
    processor: AvailabilityProcessor::class,
    operations: [
        new Get(),
        new GetCollection(),
        new Post(
            processor: AvailabilityProcessor::class,
            security: "is_granted('ROLE_TUTOR')",
            securityPostDenormalize: "is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId()",
            securityMessage: 'Only the owner of the related tutor profile can create availability slots.'
        ),
        new Put(
            processor: AvailabilityProcessor::class,
            security: "is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId()",
            securityMessage: 'Only the owner of the related tutor profile can edit availability slots.'
        ),
        new Patch(
            processor: AvailabilityProcessor::class,
            inputFormats: ['json' => ['application/merge-patch+json']],
            security: "is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId()",
            securityMessage: 'Only the owner of the related tutor profile can patch availability slots.'
        ),
        new Delete(
            processor: AvailabilityProcessor::class,
            security: "is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId()",
            securityMessage: 'Only the owner of the related tutor profile can delete availability slots.'
        ),
    ]
)]
#[ValidAvailabilityConstraint]
class Availability
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TutorProfile::class, inversedBy: 'availabilities')]
    #[ORM\JoinColumn(nullable: false)]
    private ?TutorProfile $tutorProfile = null;

    #[ORM\Column(type: 'smallint')]
    #[Assert\NotNull(message: 'Day of week is required')]
    #[Assert\Range(min: 0, max: 6, notInRangeMessage: 'Day of week must be between 0 and 6')]
    private ?int $dayOfWeek = null;

    #[ORM\Column(type: 'time')]
    #[Assert\NotNull(message: 'Start time is required')]
    private ?\DateTimeInterface $startTime = null;

    #[ORM\Column(type: 'time')]
    #[Assert\NotNull(message: 'End time is required')]
    private ?\DateTimeInterface $endTime = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTutorProfile(): ?TutorProfile
    {
        return $this->tutorProfile;
    }

    public function setTutorProfile(?TutorProfile $tutorProfile): static
    {
        $this->tutorProfile = $tutorProfile;
        return $this;
    }

    public function getDayOfWeek(): ?int
    {
        return $this->dayOfWeek;
    }

    public function setDayOfWeek(int $dayOfWeek): static
    {
        $this->dayOfWeek = $dayOfWeek;
        return $this;
    }

    public function getStartTime(): ?\DateTimeInterface
    {
        return $this->startTime;
    }

    public function setStartTime(\DateTimeInterface $startTime): static
    {
        $this->startTime = $startTime;
        return $this;
    }

    public function getEndTime(): ?\DateTimeInterface
    {
        return $this->endTime;
    }

    public function setEndTime(\DateTimeInterface $endTime): static
    {
        $this->endTime = $endTime;
        return $this;
    }
}
