'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Home, List, Tag, BarChart2, Settings, LogOut, Plus } from 'lucide-react';
import { useTweaks } from './Providers';
import { I18N } from '@/lib/i18n';
import { cx } from './Primitives';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Shell({ children }: { children: React.ReactNode }) {
  const { tweaks } = useTweaks();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { id: "/dashboard", label: t.nav.dashboard, icon: <Home size={17} /> },
    { id: "/transactions", label: t.nav.transactions, icon: <List size={17} /> },
    { id: "/categories", label: t.nav.categories, icon: <Tag size={17} /> },
    { id: "/budgets", label: t.nav.budgets, icon: <Wallet size={17} /> },
    { id: "/reports", label: t.nav.reports, icon: <BarChart2 size={17} /> },
    { id: "/settings", label: t.nav.settings, icon: <Settings size={17} /> },
  ];

  const compact = tweaks.compactSidebar;
  const isLoginPage = pathname === '/login';

  if (isLoginPage) return <>{children}</>;

  return (
    <div className={cx("shell", compact && "compact")}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Wallet size={18} /></div>
          {!compact && (
            <div>
              <div className="brand-name">Ledger</div>
              <div className="brand-sub">{t.appSub}</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(n => {
            const isActive = pathname === n.id;
            return (
              <Link key={n.id} href={n.id} className={cx("nav-item", isActive && "is-active")} title={compact ? n.label : undefined}>
                {n.icon}
                {!compact && <span>{n.label}</span>}
                {!compact && isActive && <span className="nav-dot"></span>}
              </Link>
            );
          })}
        </nav>

        <div className="side-foot">
          <button className="nav-item" title={compact ? t.nav.logout : undefined} onClick={handleSignOut}>
            <LogOut size={17} />
            {!compact && <span>{t.nav.logout}</span>}
          </button>
          {!compact && session?.user && (
            <div className="side-user">
              <div className="user-avatar">{session.user.name?.slice(0, 2).toUpperCase() || 'US'}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="user-name">{session.user.name}</div>
                <div className="user-mail">{session.user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="main-inner">{children}</div>
      </main>

      {/* Mobile Nav */}
      <nav className="mobile-nav">
        {navItems.slice(0, 5).map(n => {
          const isActive = pathname === n.id;
          return (
            <Link key={n.id} href={n.id} className={cx("mobile-nav-item", isActive && "is-active")}>
              {n.icon}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
