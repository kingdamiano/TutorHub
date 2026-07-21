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
      <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)]">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Забронировать урок</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Войдите, чтобы забронировать урок и выбрать удобное время.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Войти
        </Link>
      </section>
    );
  }

  if (subjectOptions.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)]">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Забронировать урок</h2>
        <p className="mt-3 text-sm text-muted-foreground">Нет доступных предметов для бронирования.</p>
      </section>
    );
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
    <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)] sm:p-8">
      <h2 className="font-serif text-2xl font-semibold text-foreground">Забронировать урок</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
            Предмет
          </label>
          <select
            id="subject"
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-0"
          >
            {subjectOptions.map((subject) => (
              <option key={subject.iri} value={subject.iri}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startAt" className="mb-2 block text-sm font-medium text-foreground">
            Дата и время начала
          </label>
          <input
            id="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"
          />
        </div>
        <div>
          <label htmlFor="durationMinutes" className="mb-2 block text-sm font-medium text-foreground">
            Длительность (минут)
          </label>
          <input
            id="durationMinutes"
            type="number"
            value={durationMinutes}
            min="15"
            max="240"
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"
          />
        </div>
        {statusMessage && <div className="rounded-xl border border-border bg-background/80 px-3 py-2 text-sm text-foreground">{statusMessage}</div>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Отправка...' : 'Забронировать'}
        </button>
      </form>
    </section>
  );
}
