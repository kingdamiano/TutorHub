'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.status === 201) {
        document.cookie = `token=${encodeURIComponent(data.token)}; path=/`;
        document.cookie = `userEmail=${encodeURIComponent(data.user.email)}; path=/`;
        router.push('/tutors');
        return;
      }

      setError(data.message ?? 'Ошибка регистрации');
    } catch (err) {
      setError('Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Регистрация</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Создайте аккаунт и начните искать подходящего репетитора или преподавателя.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="role" className="mb-2 block text-sm font-medium text-foreground">
              Роль
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
            >
              <option value="student">student</option>
              <option value="tutor">tutor</option>
            </select>
          </div>
          {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </section>
    </main>
  );
}
