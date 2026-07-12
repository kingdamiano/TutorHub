<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ApiResource(
    operations: [
        new Get(
            security: "(is_granted('ROLE_STUDENT') and object.getStudent() and object.getStudent().getId() == user.getId()) or (is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId())",
            securityMessage: 'Access denied. You are not related to this booking.'
        ),
        new GetCollection(
            security: "is_granted('ROLE_STUDENT') or is_granted('ROLE_TUTOR')",
            securityMessage: 'Only students and tutors can view bookings.'
        ),
        new Post(
            security: "is_granted('ROLE_STUDENT')",
            securityPostDenormalize: "is_granted('ROLE_STUDENT') and object.getStudent() and object.getStudent().getId() == user.getId()",
            securityMessage: 'Only the booking student can create a booking for themselves.'
        ),
        new Put(
            security: "(is_granted('ROLE_STUDENT') and object.getStudent() and object.getStudent().getId() == user.getId()) or (is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId())",
            securityMessage: 'Only the booking student or the related tutor can edit this booking.'
        ),
        new Patch(
            security: "(is_granted('ROLE_STUDENT') and object.getStudent() and object.getStudent().getId() == user.getId()) or (is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId())",
            securityMessage: 'Only the booking student or the related tutor can patch this booking.'
        ),
        new Delete(
            security: "(is_granted('ROLE_STUDENT') and object.getStudent() and object.getStudent().getId() == user.getId()) or (is_granted('ROLE_TUTOR') and object.getTutorProfile() and object.getTutorProfile().getUser() and object.getTutorProfile().getUser().getId() == user.getId())",
            securityMessage: 'Only the booking student or the related tutor can delete this booking.'
        ),
    ]
)]
class Booking
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'bookings')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $student = null;

    #[ORM\ManyToOne(targetEntity: TutorProfile::class, inversedBy: 'bookings')]
    #[ORM\JoinColumn(nullable: false)]
    private ?TutorProfile $tutorProfile = null;

    #[ORM\ManyToOne(targetEntity: Subject::class, inversedBy: 'bookings')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Subject $subject = null;

    #[ORM\Column(type: 'datetime')]
    #[Assert\GreaterThan('now', message: 'Booking start time must be in the future')]
    private ?\DateTimeInterface $startAt = null;

    #[ORM\Column(type: 'integer')]
    #[Assert\Range(min: 15, max: 240, notInRangeMessage: 'Duration must be between {{ min }} and {{ max }} minutes')]
    #[Assert\NotNull(message: 'Duration is required')]
    private ?int $durationMinutes = null;

    #[ORM\Column(type: 'string', enumType: BookingStatus::class)]
    private BookingStatus $status = BookingStatus::PENDING;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\OneToOne(targetEntity: Review::class, mappedBy: 'booking')]
    private ?Review $review = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStudent(): ?User
    {
        return $this->student;
    }

    public function setStudent(?User $student): static
    {
        $this->student = $student;
        return $this;
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

    public function getSubject(): ?Subject
    {
        return $this->subject;
    }

    public function setSubject(?Subject $subject): static
    {
        $this->subject = $subject;
        return $this;
    }

    public function getStartAt(): ?\DateTimeInterface
    {
        return $this->startAt;
    }

    public function setStartAt(\DateTimeInterface $startAt): static
    {
        $this->startAt = $startAt;
        return $this;
    }

    public function getDurationMinutes(): ?int
    {
        return $this->durationMinutes;
    }

    public function setDurationMinutes(int $durationMinutes): static
    {
        $this->durationMinutes = $durationMinutes;
        return $this;
    }

    public function getStatus(): BookingStatus
    {
        return $this->status;
    }

    public function setStatus(BookingStatus $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getReview(): ?Review
    {
        return $this->review;
    }

    public function setReview(?Review $review): static
    {
        $this->review = $review;
        return $this;
    }
}
