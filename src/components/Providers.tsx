'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

interface Tweaks {
  theme: 'light' | 'dark';
  density: 'compact' | 'default' | 'cozy';
  accentHue: number;
  locale: 'th' | 'en';
  compactSidebar: boolean;
  showSavingsRate: boolean;
  currencyStyle: 'symbol' | 'code';
}

const TWEAK_DEFAULTS: Tweaks = {
  theme: 'light',
  density: 'default',
  accentHue: 270,
  locale: 'th',
  compactSidebar: false,
  showSavingsRate: true,
  currencyStyle: 'symbol',
};

const TweaksContext = createContext<{
  tweaks: Tweaks;
  setTweak: (key: keyof Tweaks, value: any) => void;
} | undefined>(undefined);

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem('ledger-tweaks');
    if (saved) {
      try {
        setTweaks({ ...TWEAK_DEFAULTS, ...JSON.parse(saved) });
      } catch (e) {}
    }
  }, []);

  const setTweak = (key: keyof Tweaks, value: any) => {
    setTweaks(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('ledger-tweaks', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.setAttribute('data-density', tweaks.density);
    const root = document.documentElement;
    const h = tweaks.accentHue;
    root.style.setProperty("--accent", `oklch(${tweaks.theme === "dark" ? "0.7" : "0.55"} 0.18 ${h})`);
    root.style.setProperty("--accent-soft", `oklch(${tweaks.theme === "dark" ? "0.7" : "0.55"} 0.18 ${h} / ${tweaks.theme === "dark" ? "0.18" : "0.09"})`);
    root.style.setProperty("--accent-ink", `oklch(${tweaks.theme === "dark" ? "0.82" : "0.4"} 0.16 ${h})`);
  }, [tweaks.theme, tweaks.density, tweaks.accentHue]);

  return (
    <SessionProvider>
      <TweaksContext.Provider value={{ tweaks, setTweak }}>
        {children}
      </TweaksContext.Provider>
    </SessionProvider>
  );
}

export function useTweaks() {
  const context = useContext(TweaksContext);
  if (!context) throw new Error('useTweaks must be used within TweaksProvider');
  return context;
}
