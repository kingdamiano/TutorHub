<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        new Put(),
        new Delete(),
    ]
)]
class Subject
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Assert\NotBlank(message: 'Subject name cannot be empty')]
    private ?string $name = null;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    #[Assert\NotBlank(message: 'Slug cannot be empty')]
    #[Assert\Regex(pattern: '/^[a-z0-9-]+$/', message: 'Slug must contain only lowercase letters, numbers, and hyphens')]
    private ?string $slug = null;

    #[ORM\ManyToMany(targetEntity: TutorProfile::class, mappedBy: 'subjects')]
    private Collection $tutorProfiles;

    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'subject')]
    private Collection $bookings;

    public function __construct()
    {
        $this->tutorProfiles = new ArrayCollection();
        $this->bookings = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;
        return $this;
    }

    public function getTutorProfiles(): Collection
    {
        return $this->tutorProfiles;
    }

    public function addTutorProfile(TutorProfile $tutorProfile): static
    {
        if (!$this->tutorProfiles->contains($tutorProfile)) {
            $this->tutorProfiles->add($tutorProfile);
        }
        return $this;
    }

    public function removeTutorProfile(TutorProfile $tutorProfile): static
    {
        if ($this->tutorProfiles->removeElement($tutorProfile)) {
            // owning side (TutorProfile) should handle the inverse relationship
        }
        return $this;
    }

    public function getBookings(): Collection
    {
        return $this->bookings;
    }
}
