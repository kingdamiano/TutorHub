import Link from 'next/link';
import React from 'react';

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

function getTutorId(tutor: any) {
  if (typeof tutor.id === 'number' || typeof tutor.id === 'string') {
    return tutor.id;
  }
  if (typeof tutor['@id'] === 'string') {
    const segments = tutor['@id'].split('/').filter(Boolean);
    return segments[segments.length - 1];
  }
  return undefined;
}

export default async function TutorsPage() {
  const tutors = await fetchTutors();

  return (
    <main>
      <h1>TutorHub</h1>
      <h2>Каталог репетиторов</h2>
      <ul>
        {tutors.map((tutor: any) => {
          const tutorId = getTutorId(tutor);
          return (
            <li key={tutor['@id'] ?? tutor.id}>
              <Link href={`/tutors/${tutorId}`}>
                <div>City: {tutor.city ?? 'N/A'}</div>
                <div>Bio: {tutor.bio ?? 'N/A'}</div>
                <div>Price per hour: {tutor.pricePerHour ?? 'N/A'}</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
