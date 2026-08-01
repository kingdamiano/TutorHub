import { ChevronRight, Play, Star } from 'lucide-react';
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
  if (tutor.user && typeof tutor.user !== 'string' && tutor.user.email) {
    return tutor.user.email.split('@')[0];
  }
  if (tutor.city) {
    return tutor.city;
  }
  return 'Репетитор';
}

function getInitials(tutor: TutorProfile) {
  const source = [tutor.user && typeof tutor.user !== 'string' ? tutor.user.email : '', tutor.city, tutor.bio]
    .filter(Boolean)
    .join(' ');
  const letters = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '');
  return letters.join('') || 'T';
}

export default function TutorCard({ tutor, isActive }: { tutor: TutorProfile; isActive?: boolean }) {
  const id = getTutorId(tutor);
  const price = tutor.pricePerHour ?? '—';
  const city = tutor.city ?? '—';
  const title = getCardTitle(tutor);
  const initials = getInitials(tutor);
  const subjectNames = (tutor.subjects ?? [])
    .map((subject: any) => {
      if (typeof subject === 'string') {
        const segments = subject.split('/').filter(Boolean);
        return segments[segments.length - 1] ?? subject;
      }
      return subject?.name ?? '';
    })
    .filter(Boolean);
  const visibleSubjects = subjectNames.slice(0, 2);
  const extraCount = Math.max(0, subjectNames.length - visibleSubjects.length);

  return (
    <Link
      href={`/tutors/${id}`}
      className={`group block h-[300px] w-full overflow-hidden rounded-2xl border-[0.5px] border-[rgba(245,222,179,0.4)] bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${
        isActive ? 'scale-100 shadow-2xl lg:scale-105' : 'scale-100 lg:scale-95'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="relative h-[190px] overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#3D1534] to-[#3E4B8E]">
          <div className="absolute inset-0 flex items-center justify-center text-5xl font-semibold tracking-[0.08em] text-white/90">
            {initials}
          </div>

          <div className="absolute left-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
            <Play className="h-5 w-5 text-white" />
          </div>

          <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] font-semibold">5.0</span>
            </div>
          </div>

          <div className="hidden lg:block absolute right-4 bottom-4 rounded-full bg-black/30 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
            Новый преподаватель
          </div>
        </div>

        <div className="flex h-[160px] flex-col justify-between bg-white p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="min-w-0 truncate text-sm sm:text-base font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-[10px] sm:text-sm text-muted-foreground">{city} · {price} ₽/ч</p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 text-[10px] sm:text-[11px]">
            {visibleSubjects.map((subject, index) => (
              <span
                key={`${subject}-${index}`}
                className="flex-shrink-0 rounded-full border border-border bg-[#F6F6FF] px-2.5 py-1 font-medium text-[#0B3D91]"
              >
                {subject}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="flex-shrink-0 rounded-full border border-border bg-[#F6F6FF] px-2.5 py-1 font-medium text-[#0B3D91]">
                +{extraCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
