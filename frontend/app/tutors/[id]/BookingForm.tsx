'use client';

import { useEffect, useState } from 'react';
import { useAuthModal } from '../../AuthModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const { openAuthModal } = useAuthModal();
  const [token, setToken] = useState<string | null>(null);
  const [studentIri, setStudentIri] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(subjectOptions[0]?.iri ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const next = minutes < 30 ? 30 : 60;
    now.setMinutes(next === 60 ? 0 : next);
    if (next === 60) now.setHours(now.getHours() + 1);
    return now.toTimeString().slice(0, 5);
  });
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
      <section className="rounded-[1.25rem] border border-[#3D1534]/10 bg-[#FFF4EB] p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)] sm:p-8">
        <h2 className="font-sans text-2xl font-semibold text-foreground">Забронировать урок</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Войдите, чтобы забронировать урок и выбрать удобное время.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Войти
        </button>
      </section>
    );
  }

  if (subjectOptions.length === 0) {
    return (
      <section className="rounded-[1.25rem] border border-[#3D1534]/10 bg-[#FFF4EB] p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)] sm:p-8">
        <h2 className="font-sans text-2xl font-semibold text-foreground">Забронировать урок</h2>
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

    if (!date || !time) {
      setStatusMessage('Выберите дату и время начала.');
      setIsSubmitting(false);
      return;
    }

    const isoStartAt = `${date}T${time}:00`;

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
          startAt: isoStartAt,
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
    <section className="rounded-[1.25rem] border border-[#3D1534]/10 bg-[#FFF4EB] p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)] sm:p-8">
      <h2 className="font-sans text-2xl font-semibold text-foreground">Забронировать урок</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
            Предмет
          </label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger id="subject">
              <SelectValue placeholder="Выберите предмет" />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((subject) => (
                <SelectItem key={subject.iri} value={subject.iri}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-foreground">
              Дата
            </label>
            <input
              id="startDate"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="h-12 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label htmlFor="startTime" className="mb-2 block text-sm font-medium text-foreground">
              Время
            </label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="startTime">
                <SelectValue placeholder="Выберите время" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 48 }).map((_, index) => {
                  const hours = Math.floor(index / 2);
                  const minutes = index % 2 === 0 ? '00' : '30';
                  const value = `${hours.toString().padStart(2, '0')}:${minutes}`;
                  return (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label htmlFor="durationMinutes" className="mb-2 block text-sm font-medium text-foreground">
            Длительность (минут)
          </label>
          <Select value={durationMinutes} onValueChange={setDurationMinutes}>
            <SelectTrigger id="durationMinutes">
              <SelectValue placeholder="Длительность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 минут</SelectItem>
              <SelectItem value="60">60 минут</SelectItem>
              <SelectItem value="90">90 минут</SelectItem>
              <SelectItem value="120">120 минут</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {statusMessage && (
          <div className="rounded-xl border border-border bg-[#F6E0B6]/20 px-3 py-3 text-sm text-foreground">
            {statusMessage}
          </div>
        )}
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
