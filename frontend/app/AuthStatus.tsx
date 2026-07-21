'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = getCookieValue('token');
    const email = getCookieValue('userEmail');

    if (token) {
      if (email) {
        setUserEmail(email);
      }
      // fetch /api/me to determine roles
      (async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
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
          if (j.roles && Array.isArray(j.roles)) {
            if (j.roles.includes('ROLE_TUTOR')) setIsTutor(true);
            if (j.roles.includes('ROLE_ADMIN')) setIsAdmin(true);
          }
        } catch (e) {
          // ignore
        } finally {
          setIsLoaded(true);
        }
      })();
    } else {
      setUserEmail(null);
      setIsLoaded(true);
    }
  }, [pathname]);

  function handleLogout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    setUserEmail(null);
    router.push('/');
  }

  if (!isLoaded) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (userEmail) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">Вы вошли как {userEmail}</span>
        <Link href="/dashboard" className="text-sm text-foreground/70 transition hover:text-foreground">
          Личный кабинет
        </Link>
        {isTutor && (
          <>
            <Link href="/tutor/profile" className="text-sm text-foreground/70 transition hover:text-foreground">
              Профиль репетитора
            </Link>
            <Link href="/tutor/availability" className="text-sm text-foreground/70 transition hover:text-foreground">
              Расписание
            </Link>
          </>
        )}
        {isAdmin && (
          <Link href="/admin" className="text-sm text-foreground/70 transition hover:text-foreground">
            Модерация
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-primary px-4 py-1.5 text-sm text-primary transition hover:bg-primary/10"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground transition hover:bg-secondary/70">
        Войти
      </Link>
      <Link href="/register" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
        Регистрация
      </Link>
    </div>
  );
}
