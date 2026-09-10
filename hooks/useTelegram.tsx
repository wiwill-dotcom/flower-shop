'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { defaultTheme, getTheme, isTelegramLaunch, type TelegramEvent, type TelegramUser, type TelegramWebApp } from '@/lib/telegram';

type TelegramState = {
  /** Unverified display data; never use for authentication or order validation. */
  telegramUser: TelegramUser | null;
  /** Raw, unverified data. Memory only; never logged or transmitted. */
  initData: string;
  colorScheme: 'light' | 'dark';
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  theme: typeof defaultTheme;
};
const fallback: TelegramState = {
  telegramUser: null, initData: '', colorScheme: 'light',
  isTelegram: false, webApp: null, theme: defaultTheme,
};
const TelegramContext = createContext<TelegramState>(fallback);
const initialized = new WeakSet<TelegramWebApp>();

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramState>(fallback);
  useEffect(() => {
    const root = document.documentElement;
    const properties = new Set<string>();
    let detach: (() => void) | undefined;
    const set = (name: string, value: string) => {
      properties.add(name);
      root.style.setProperty(name, value);
    };
    const connect = () => {
      const app = window.Telegram?.WebApp;
      if (!app || detach || !isTelegramLaunch(app)) return;
      const refresh = () => {
        const theme = getTheme(app.themeParams);
        setState({ telegramUser: app.initDataUnsafe.user ?? null, initData: app.initData,
          colorScheme: app.colorScheme, isTelegram: true, webApp: app, theme });
        root.dataset.telegram = 'true';
        for (const [key, value] of Object.entries(theme)) set(`--lepestok-tg-${key}`, value);
        for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
          const px = (value = 0) => `${Number.isFinite(value) ? Math.max(0, value) : 0}px`;
          set(`--lepestok-safe-${edge}`, px(app.safeAreaInset?.[edge]));
          set(`--lepestok-content-safe-${edge}`, px(app.contentSafeAreaInset?.[edge]));
        }
      };
      const events: TelegramEvent[] = ['themeChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'viewportChanged'];
      events.forEach(event => app.onEvent(event, refresh));
      detach = () => events.forEach(event => app.offEvent(event, refresh));
      refresh();
      if (!initialized.has(app)) {
        app.ready();
        app.expand();
        initialized.add(app);
      }
    };
    // beforeInteractive runs before hydration; also allow delayed script loading.
    const script = document.getElementById('telegram-webapp');
    script?.addEventListener('load', connect);
    connect();
    return () => {
      script?.removeEventListener('load', connect);
      detach?.();
      delete root.dataset.telegram;
      properties.forEach(name => root.style.removeProperty(name));
    };
  }, []);
  return <TelegramContext.Provider value={state}>{children}</TelegramContext.Provider>;
}
export function useTelegram() { return useContext(TelegramContext); }
