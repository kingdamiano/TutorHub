'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SubjectOption {
  iri: string;
  name: string;
}

interface BookingFormProps {
  tutorProfileIri: string;
  subjectOptions: SubjectOption[];
}

function getCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieString = document.cookie;
  const pairs = cookieString.split(';').map((part) => part.trim());
  const match = pairs.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function BookingForm({ tutorProfileIri, subjectOptions }: BookingFormProps) {
  const [token, setToken] = useState<string | null>(null);
  const [studentIri, setStudentIri] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(subjectOptions[0]?.iri ?? '');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const tokenValue = getCookieValue('token');
    setToken(tokenValue);

    if (!tokenValue) {
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (data.id) {
          setStudentIri(`/api/users/${data.id}`);
        }
      } catch (err) {
        // ignore
      }
    }

    fetchMe();
  }, []);

  if (!token) {
    return (
      <div>
        Войдите, чтобы забронировать урок. <Link href="/login">Войти</Link>
      </div>
    );
  }

  if (subjectOptions.length === 0) {
    return <div>Нет доступных предметов для бронирования.</div>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    if (!studentIri) {
      setStatusMessage('Не удалось определить пользователя.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ld+json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student: studentIri,
          tutorProfile: tutorProfileIri,
          subject: selectedSubject,
          startAt,
          durationMinutes: parseInt(durationMinutes, 10),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage('Бронирование успешно создано.');
        return;
      }

      setStatusMessage(data.message ?? 'Ошибка при создании бронирования.');
    } catch (error) {
      setStatusMessage('Ошибка при создании бронирования.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Забронировать урок</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="subject">Предмет</label>
          <select
            id="subject"
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
          >
            {subjectOptions.map((subject) => (
              <option key={subject.iri} value={subject.iri}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startAt">Дата и время начала</label>
          <input
            id="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="durationMinutes">Длительность (минут)</label>
          <input
            id="durationMinutes"
            type="number"
            value={durationMinutes}
            min="15"
            max="240"
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
          />
        </div>
        {statusMessage && <div>{statusMessage}</div>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Отправка...' : 'Забронировать'}
        </button>
      </form>
    </section>
  );
}
