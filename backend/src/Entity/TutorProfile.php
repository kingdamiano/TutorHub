<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Doctrine\Orm\Filter\RangeFilter;
use ApiPlatform\Doctrine\Orm\Filter\BooleanFilter;
use ApiPlatform\Metadata\ApiFilter;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection(),
        new Post(
            security: "is_granted('ROLE_TUTOR')",
            securityMessage: 'Only tutors can create a tutor profile.'
        ),
        new Put(
            security: "is_granted('ROLE_TUTOR') and object.getUser().getId() == user.getId()",
            securityMessage: 'Only the profile owner can edit this tutor profile.'
        ),
        new Patch(
            inputFormats: ['json' => ['application/merge-patch+json']],
            security: "is_granted('ROLE_TUTOR') and object.getUser().getId() == user.getId()",
            securityMessage: 'Only the profile owner can patch this tutor profile.'
        ),
        new Delete(
            security: "is_granted('ROLE_TUTOR') and object.getUser().getId() == user.getId()",
            securityMessage: 'Only the profile owner can delete this tutor profile.'
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['city' => 'partial', 'subjects.id' => 'exact', 'subjects.slug' => 'exact'])]
#[ApiFilter(RangeFilter::class, properties: ['pricePerHour'])]
#[ApiFilter(BooleanFilter::class, properties: ['isApproved'])]
class TutorProfile
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: User::class, inversedBy: 'tutorProfile')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Assert\Length(min: 1, max: 2000, minMessage: 'Bio cannot be empty', maxMessage: 'Bio must not exceed 2000 characters')]
    private ?string $bio = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Assert\NotBlank(message: 'City cannot be empty')]
    private ?string $city = null;

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2)]
    #[Assert\Positive(message: 'Price per hour must be greater than 0')]
    #[Assert\NotNull(message: 'Price per hour is required')]
    private ?string $pricePerHour = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $photo = null;

    #[ORM\Column(type: 'decimal', precision: 3, scale: 2, nullable: true)]
    private ?string $rating = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isApproved = false;

    #[ORM\ManyToMany(targetEntity: Subject::class, inversedBy: 'tutorProfiles', cascade: ['persist'])]
    private Collection $subjects;

    #[ORM\OneToMany(targetEntity: Availability::class, mappedBy: 'tutorProfile', cascade: ['remove'])]
    private Collection $availabilities;

    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'tutorProfile', cascade: ['remove'])]
    private Collection $bookings;

    public function __construct()
    {
        $this->subjects = new ArrayCollection();
        $this->availabilities = new ArrayCollection();
        $this->bookings = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;
        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): static
    {
        $this->city = $city;
        return $this;
    }

    public function getPricePerHour(): ?string
    {
        return $this->pricePerHour;
    }

    public function setPricePerHour(string $pricePerHour): static
    {
        $this->pricePerHour = $pricePerHour;
        return $this;
    }

    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    public function setPhoto(?string $photo): static
    {
        $this->photo = $photo;
        return $this;
    }

    public function getRating(): ?string
    {
        return $this->rating;
    }

    public function setRating(?string $rating): static
    {
        $this->rating = $rating;
        return $this;
    }

    public function isApproved(): bool
    {
        return $this->isApproved;
    }

    public function setIsApproved(bool $isApproved): static
    {
        $this->isApproved = $isApproved;
        return $this;
    }

    public function getSubjects(): Collection
    {
        return $this->subjects;
    }

    public function addSubject(Subject $subject): static
    {
        if (!$this->subjects->contains($subject)) {
            $this->subjects->add($subject);
        }
        return $this;
    }

    public function removeSubject(Subject $subject): static
    {
        if ($this->subjects->removeElement($subject)) {
        }
        return $this;
    }

    public function getAvailabilities(): Collection
    {
        return $this->availabilities;
    }

    public function addAvailability(Availability $availability): static
    {
        if (!$this->availabilities->contains($availability)) {
            $this->availabilities->add($availability);
            $availability->setTutorProfile($this);
        }
        return $this;
    }

    public function removeAvailability(Availability $availability): static
    {
        if ($this->availabilities->removeElement($availability)) {
            if ($availability->getTutorProfile() === $this) {
                $availability->setTutorProfile(null);
            }
        }
        return $this;
    }

    public function getBookings(): Collection
    {
        return $this->bookings;
    }

    public function addBooking(Booking $booking): static
    {
        if (!$this->bookings->contains($booking)) {
            $this->bookings->add($booking);
            $booking->setTutorProfile($this);
        }
        return $this;
    }

    public function removeBooking(Booking $booking): static
    {
        if ($this->bookings->removeElement($booking)) {
            if ($booking->getTutorProfile() === $this) {
                $booking->setTutorProfile(null);
            }
        }
        return $this;
    }
}
