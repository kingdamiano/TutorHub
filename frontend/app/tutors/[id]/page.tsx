import React from 'react';
import BookingForm from './BookingForm';

interface TutorPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function fetchTutor(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles/${id}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch tutor profile, status ${res.status}`);
  }
  return res.json();
}

async function fetchSubjectName(subjectIri: string) {
  const segments = subjectIri.split('/').filter(Boolean);
  const subjectId = segments[segments.length - 1];
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects/${subjectId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    return 'Unknown subject';
  }
  const data = await res.json();
  return data.name ?? 'Unknown subject';
}

export default async function TutorProfilePage({ params }: TutorPageProps) {
  const { id } = await params;
  const tutor = await fetchTutor(id);

  if (!tutor) {
    return (
      <main>
        <h1>Репетитор не найден</h1>
      </main>
    );
  }

  const subjectNames = await Promise.all(
    (tutor.subjects ?? []).map((subjectIri: string) => fetchSubjectName(subjectIri))
  );

  const subjectOptions = (tutor.subjects ?? []).map((subjectIri: string, index: number) => ({
    iri: subjectIri,
    name: subjectNames[index] ?? 'Unknown subject',
  }));

  return (
    <main>
      <h1>Профиль репетитора {id}</h1>
      <div>City: {tutor.city ?? 'N/A'}</div>
      <div>Bio: {tutor.bio ?? 'N/A'}</div>
      <div>Price per hour: {tutor.pricePerHour ?? 'N/A'}</div>
      {tutor.rating !== undefined && <div>Rating: {tutor.rating}</div>}
      <div>
        <h2>Subjects</h2>
        <ul>
          {subjectNames.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      </div>
      <BookingForm tutorProfileIri={tutor['@id'] ?? `/api/tutor_profiles/${id}`} subjectOptions={subjectOptions} />
    </main>
  );
}
