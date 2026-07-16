<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use App\Validator\ValidReviewConstraint;

#[ORM\Entity]
#[ApiResource(
    operations: [
        new Get(
            security: "true"
        ),
        new GetCollection(
            security: "true"
        ),
        new Post(
            security: "is_granted('ROLE_STUDENT')",
            securityPostDenormalize: "is_granted('ROLE_STUDENT') and object.getBooking() and object.getBooking().getStudent() and object.getBooking().getStudent().getId() == user.getId()",
            securityMessage: 'Only the booking student can create a review.'
        ),
        new Put(
            security: "is_granted('ROLE_STUDENT') and object.getBooking() and object.getBooking().getStudent() and object.getBooking().getStudent().getId() == user.getId()",
            securityMessage: 'Only the booking student can edit this review.'
        ),
        new Delete(
            security: "is_granted('ROLE_STUDENT') and object.getBooking() and object.getBooking().getStudent() and object.getBooking().getStudent().getId() == user.getId()",
            securityMessage: 'Only the booking student can delete this review.'
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['booking.tutorProfile' => 'exact'])]
#[ValidReviewConstraint]
class Review
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Booking::class, inversedBy: 'review')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Booking $booking = null;

    #[ORM\Column(type: 'smallint')]
    #[Assert\Range(min: 1, max: 5, notInRangeMessage: 'Rating must be between 1 and 5')]
    #[Assert\NotNull(message: 'Rating is required')]
    private ?int $rating = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBooking(): ?Booking
    {
        return $this->booking;
    }

    public function setBooking(Booking $booking): static
    {
        $this->booking = $booking;
        return $this;
    }

    public function getRating(): ?int
    {
        return $this->rating;
    }

    public function setRating(int $rating): static
    {
        $this->rating = $rating;
        return $this;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function setComment(?string $comment): static
    {
        $this->comment = $comment;
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

    public function getStudent(): ?User
    {
        return $this->booking?->getStudent();
    }
}
