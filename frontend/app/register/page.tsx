'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BackgroundBlobs from '../../components/BackgroundBlobs';

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
    } catch {
      setError('Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#3D1534] px-4 pt-28 pb-4 sm:px-6 lg:px-8">
      <BackgroundBlobs className="absolute inset-0 pointer-events-none" />
      <section className="mt-20 w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-9 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="flex-1 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-secondary/30 hover:text-slate-900"
          >
            Войти
          </button>
          <button
            type="button"
            className="flex-1 rounded-full bg-[#3D1534] px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            Регистрация
          </button>
        </div>

        <div className="mt-6">
          <h1 className="font-sans text-2xl font-semibold text-slate-900">Регистрация</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Создайте аккаунт и начните искать подходящего репетитора или преподавателя.
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
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
                Роль
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#3D1534]"
                >
                  <option value="student">Ученик</option>
                  <option value="tutor">Репетитор</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
            {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#3D1534] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2F102A] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Уже есть аккаунт?{' '}
            <button type="button" onClick={() => router.push('/login')} className="font-semibold text-[#3D1534] underline-offset-4 transition-colors duration-200 hover:text-[#2F102A] hover:underline">
              Войти
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
