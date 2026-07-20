import Link from 'next/link';

type TutorProfile = {
  '@id'?: string;
  id?: number | string;
  city?: string | null;
  bio?: string | null;
  pricePerHour?: string | number | null;
  subjects?: Array<any> | null;
  user?: string | { id?: number | string; email?: string } | null;
};

function getTutorId(tutor: TutorProfile) {
  if (typeof tutor.id === 'number' || typeof tutor.id === 'string') return tutor.id;
  if (typeof tutor['@id'] === 'string') {
    const segments = tutor['@id'].split('/').filter(Boolean);
    return segments[segments.length - 1];
  }
  return undefined;
}

function getCardTitle(tutor: TutorProfile) {
  const bio = tutor.bio?.trim();

  if (bio) {
    const words = bio.split(/\s+/).filter(Boolean);
    const preview = words.slice(0, 6).join(' ');
    return preview.length < bio.length ? `${preview}…` : preview;
  }

  if (tutor.city) {
    return tutor.city;
  }

  return 'Tutor profile';
}

export default function TutorCard({ tutor }: { tutor: TutorProfile }) {
  const id = getTutorId(tutor);
  const price = tutor.pricePerHour ?? '—';
  const city = tutor.city ?? '—';
  const bio = tutor.bio ?? '';
  const title = getCardTitle(tutor);

  return (
    <Link href={`/tutors/${id}`} className="block p-4 bg-card border border-border rounded-lg hover:shadow-lg transition">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground">👩‍🏫</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{city}</div>
          </div>
          <p className="mt-2 text-sm text-card-foreground/85 line-clamp-3">{bio}</p>
          <div className="mt-3 text-sm font-medium">Цена: {price} ₽/ч</div>
        </div>
      </div>
    </Link>
  );
}
