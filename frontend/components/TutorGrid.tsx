import TutorCard from './TutorCard';

export default function TutorGrid({ tutors }: { tutors: any[] }) {
  if (!tutors || tutors.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/80 px-6 py-8 text-center text-sm text-slate-600">Список репетиторов пуст</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
      {tutors.map((t) => (
        <div key={t['@id'] ?? t.id} className="flex justify-center">
          <div className="w-full max-w-sm min-w-0 overflow-visible">
            <TutorCard tutor={t} />
          </div>
        </div>
      ))}
    </div>
  );
}
