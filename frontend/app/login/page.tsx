'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        document.cookie = `token=${encodeURIComponent(data.token)}; path=/`;
        document.cookie = `userEmail=${encodeURIComponent(data.user.email)}; path=/`;
        router.push('/tutors');
        return;
      }

      if (res.status === 401) {
        setError('Неверный email или пароль');
      } else {
        setError(data.message ?? 'Ошибка входа');
      }
    } catch {
      setError('Ошибка входа');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#3D1534] px-4 pt-28 pb-4 sm:px-6 lg:px-8">
      <section className="mt-20 w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-9 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            className="flex-1 rounded-full bg-[#3D1534] px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="flex-1 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-secondary/30 hover:text-slate-900"
          >
            Регистрация
          </button>
        </div>

        <div className="mt-6">
          <h1 className="font-sans text-2xl font-semibold text-slate-900">Вход</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Войдите в аккаунт, чтобы продолжить бронирование уроков.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3D1534]"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3D1534]"
              />
            </div>
            {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#3D1534] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2F102A] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Нет аккаунта?{' '}
            <button type="button" onClick={() => router.push('/register')} className="font-semibold text-[#3D1534] underline-offset-4 transition-colors duration-200 hover:text-[#2F102A] hover:underline">
              Зарегистрироваться
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
