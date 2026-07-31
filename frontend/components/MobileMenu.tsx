'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface MobileMenuProps {
  isAuthenticated: boolean;
  userEmail?: string;
  roleLinks: { href: string; label: string }[];
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export default function MobileMenu({ isAuthenticated, userEmail, roleLinks, onLogout, onOpenAuth }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(true)} aria-label="Открыть меню">
        <Menu className="h-6 w-6 text-white" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-xs bg-[#3D1534] p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-semibold text-lg">Навигация</span>
              <button onClick={() => setIsOpen(false)} aria-label="Закрыть меню">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <p className="text-white/60 text-sm">{userEmail}</p>
                  {roleLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-white text-base">
                      {link.label}
                    </Link>
                  ))}
                  <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-left text-white text-base border-t border-white/20 pt-4 mt-2">
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { onOpenAuth('login'); setIsOpen(false); }} className="text-white text-base">
                    Войти
                  </button>
                  <button onClick={() => { onOpenAuth('register'); setIsOpen(false); }} className="text-[#F6E0B6] text-base font-semibold">
                    Регистрация
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
