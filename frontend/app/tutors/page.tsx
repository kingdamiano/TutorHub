import TutorGrid from '../../components/TutorGrid';

async function fetchTutors() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch tutors');
  }
  const data = await res.json();
  return data['hydra:member'] ?? [];
}

export default async function TutorsPage() {
  const tutors = await fetchTutors();

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-2">TutorHub</h1>
      <h2 className="text-lg text-muted-foreground mb-4">Каталог репетиторов</h2>
      <TutorGrid tutors={tutors} />
    </main>
  );
}
