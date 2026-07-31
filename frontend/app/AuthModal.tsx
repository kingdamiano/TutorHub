'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronDown } from 'lucide-react';

type AuthMode = 'login' | 'register';

type AuthModalContextValue = {
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
};

const defaultAuthModalContext: AuthModalContextValue = {
  openAuthModal: () => undefined,
  closeAuthModal: () => undefined,
};

const AuthModalContext = createContext<AuthModalContextValue>(defaultAuthModalContext);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<AuthMode>('login');

  const value = useMemo(
    () => ({
      openAuthModal: (mode: AuthMode = 'login') => {
        setInitialMode(mode);
        setIsOpen(true);
      },
      closeAuthModal: () => setIsOpen(false),
    }),
    []
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} initialMode={initialMode} onClose={() => setIsOpen(false)} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setEmail('');
    setPassword('');
    setRole('student');
    setError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const body = mode === 'login' ? { email, password } : { email, password, role };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (mode === 'login' && res.ok) {
        document.cookie = `token=${encodeURIComponent(data.token)}; path=/`;
        document.cookie = `userEmail=${encodeURIComponent(data.user.email)}; path=/`;
        window.dispatchEvent(new Event('auth-change'));
        onClose();
        router.refresh();
        return;
      }

      if (mode === 'register' && res.status === 201) {
        document.cookie = `token=${encodeURIComponent(data.token)}; path=/`;
        document.cookie = `userEmail=${encodeURIComponent(data.user.email)}; path=/`;
        window.dispatchEvent(new Event('auth-change'));
        onClose();
        router.refresh();
        return;
      }

      setError(mode === 'login' ? data.message ?? 'Ошибка входа' : data.message ?? 'Ошибка регистрации');
    } catch (error) {
      setError(mode === 'login' ? 'Ошибка входа' : 'Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-9 pt-14 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2.5 text-slate-500 transition-all duration-200 hover:bg-secondary/20 hover:text-slate-800"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${mode === 'login' ? 'bg-[#3D1534] text-white shadow-sm' : 'text-slate-600 hover:bg-secondary/30 hover:text-slate-900'}`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${mode === 'register' ? 'bg-[#3D1534] text-white shadow-sm' : 'text-slate-600 hover:bg-secondary/30 hover:text-slate-900'}`}
          >
            Регистрация
          </button>
        </div>

        <div className="mt-6">
          <h2 id="auth-modal-title" className="font-sans text-2xl font-semibold text-slate-900">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === 'login'
              ? 'Войдите в аккаунт, чтобы продолжить бронирование уроков.'
              : 'Создайте аккаунт и начните искать подходящего репетитора или преподавателя.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3D1534]"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-2 block text-sm font-medium text-slate-700">
                Пароль
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3D1534]"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-role" className="mb-2 block text-sm font-medium text-slate-700">
                  Роль
                </label>
                <div className="relative">
                  <select
                    id="auth-role"
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
            )}

            {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#3D1534] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2F102A] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (mode === 'login' ? 'Вход...' : 'Регистрация...') : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            {mode === 'login' ? (
              <>
                Нет аккаунта?{' '}
                <button type="button" onClick={() => setMode('register')} className="font-semibold text-[#3D1534] underline-offset-4 transition-colors duration-200 hover:text-[#2F102A] hover:underline">
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button type="button" onClick={() => setMode('login')} className="font-semibold text-[#3D1534] underline-offset-4 transition-colors duration-200 hover:text-[#2F102A] hover:underline">
                  Войти
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
