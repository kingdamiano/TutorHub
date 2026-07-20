import TutorCard from './TutorCard';

export default function TutorGrid({ tutors }: { tutors: any[] }) {
  if (!tutors || tutors.length === 0) {
    return <div>Список репетиторов пуст</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tutors.map((t) => (
        <TutorCard key={t['@id'] ?? t.id} tutor={t} />
      ))}
    </div>
  );
}
