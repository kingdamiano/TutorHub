<?php
namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:user:make-admin', description: 'Make a user an admin by email')]
class MakeAdminCommand extends Command
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        parent::__construct();
        $this->em = $em;
    }

    protected function configure(): void
    {
        $this->addArgument('email', InputArgument::REQUIRED, 'Email of the user');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $email = $input->getArgument('email');
        $repo = $this->em->getRepository(User::class);
        $user = $repo->findOneBy(['email' => $email]);
        if (!$user) {
            $output->writeln(sprintf('<error>User with email "%s" not found.</error>', $email));
            return Command::FAILURE;
        }

        $roles = $user->getRoles();
        if (!in_array('ROLE_ADMIN', $roles, true)) {
            $roles[] = 'ROLE_ADMIN';
            $user->setRoles($roles);
            $this->em->persist($user);
            $this->em->flush();
            $output->writeln(sprintf('<info>User %s is now an admin.</info>', $email));
        } else {
            $output->writeln(sprintf('<comment>User %s already has ROLE_ADMIN.</comment>', $email));
        }

        return Command::SUCCESS;
    }
}
