<?php

namespace App\Command;

use App\Entity\Booking;
use App\Entity\BookingStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:booking:complete',
    description: 'Mark a booking as completed',
)]
class BookingCompleteCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('booking-id', InputArgument::REQUIRED, 'The ID of the booking to complete');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $bookingId = $input->getArgument('booking-id');
        $booking = $this->em->getRepository(Booking::class)->find($bookingId);

        if (!$booking) {
            $output->writeln("<error>Booking with ID {$bookingId} not found</error>");
            return Command::FAILURE;
        }

        $booking->setStatus(BookingStatus::COMPLETED);
        $this->em->persist($booking);
        $this->em->flush();

        $output->writeln("<info>Booking {$bookingId} marked as completed</info>");
        return Command::SUCCESS;
    }
}
