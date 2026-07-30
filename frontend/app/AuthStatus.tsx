'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useAuthModal } from './AuthModal';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieString = document.cookie;
  const pairs = cookieString.split(';').map((part) => part.trim());
  const match = pairs.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function AuthStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      const token = getCookieValue('token');
      const email = getCookieValue('userEmail');

      setIsTutor(false);
      setIsAdmin(false);

      if (token) {
        if (email) {
          setUserEmail(email);
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (!isActive) return;

          if (res.status === 401) {
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            setUserEmail(null);
            return;
          }

          if (!res.ok) {
            return;
          }

          const j = await res.json();
          if (!isActive) return;

          if (j.roles && Array.isArray(j.roles)) {
            if (j.roles.includes('ROLE_TUTOR')) setIsTutor(true);
            if (j.roles.includes('ROLE_ADMIN')) setIsAdmin(true);
          }
        } catch {
          // ignore
        } finally {
          if (isActive) {
            setIsLoaded(true);
          }
        }
      } else {
        setUserEmail(null);
        setIsLoaded(true);
      }
    };

    loadUser();

    const handleAuthChange = () => {
      setIsLoaded(false);
      loadUser();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      isActive = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isSecondaryMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-secondary-menu-root]')) {
        setIsSecondaryMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSecondaryMenuOpen]);

  useEffect(() => {
    setIsSecondaryMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    setUserEmail(null);
    setIsSecondaryMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  }

  const secondaryLinks = [
    ...(isTutor
      ? [
          { href: '/tutor/profile', label: 'Профиль репетитора' },
          { href: '/tutor/availability', label: 'Расписание' },
        ]
      : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Модерация' }] : []),
  ];

  if (!isLoaded) {
    return <div className="hidden text-sm text-white/70 lg:flex">Загрузка...</div>;
  }

  const desktopContent = userEmail ? (
    <div className="hidden lg:flex flex-wrap items-center justify-end gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className="whitespace-nowrap text-sm font-medium text-white/80 transition-colors hover:text-white">
          Личный кабинет
        </Link>

        {secondaryLinks.length > 0 && (
          <div className="group relative" data-secondary-menu-root>
            <button
              type="button"
              onClick={() => setIsSecondaryMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Ещё
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSecondaryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSecondaryMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[215px] rounded-xl border border-white/10 bg-[#3D1534]/95 p-2 shadow-xl backdrop-blur">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSecondaryMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors duration-200 hover:bg-[#F6E0B6]/20 hover:text-[#F6E0B6]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          Выйти
        </button>
      </div>
    </div>
  ) : (
    <div className="hidden lg:flex items-center gap-2">
      <button
        type="button"
        onClick={() => openAuthModal('login')}
        className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)]"
      >
        Войти
      </button>
      <button
        type="button"
        onClick={() => openAuthModal('register')}
        className="inline-flex items-center justify-center rounded-full bg-[#F6E0B6] px-4 py-1.5 text-sm font-semibold text-[#3D1534] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f9e7bf] hover:shadow-[0_8px_24px_rgba(246,224,182,0.25)]"
      >
        Регистрация
      </button>
    </div>
  );

  const mobileMenu = (
    <div className="relative flex lg:hidden">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Открыть меню"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isMobileMenuOpen && (
        <div className="absolute right-0 top-full z-[60] mt-3 w-72 rounded-2xl border border-white/10 bg-[#3D1534]/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <p className="ml-2 text-sm font-semibold text-white">Навигация</p>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Закрыть меню"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {userEmail ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#F6E0B6]/80">Аккаунт</p>
                  <p className="mt-1 text-sm font-semibold text-white">{userEmail}</p>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-[#F6E0B6]/20 hover:text-[#F6E0B6]"
                >
                  Личный кабинет
                </Link>
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-[#F6E0B6]/20 hover:text-[#F6E0B6]"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/20 px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="rounded-xl bg-[#F6E0B6] px-3 py-2 text-left text-sm font-semibold text-[#3D1534] transition-colors hover:bg-[#f9e7bf]"
                >
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex items-center">
      {desktopContent}
      {mobileMenu}
    </div>
  );
}
