import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { TelegramProvider } from '@/hooks/useTelegram';
import './globals.css';
import './telegram.css';
import './checkout.css';
export const metadata: Metadata = { title: 'Лепесток — цветы с чувством', description: 'Букеты для больших событий и маленьких знаков внимания.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Telegram sets viewport CSS variables on <html> before React hydrates it.
  return <html lang="ru" suppressHydrationWarning><head><Script id="telegram-webapp" src="https://telegram.org/js/telegram-web-app.js?63" strategy="beforeInteractive" /></head><body><TelegramProvider>{children}</TelegramProvider></body></html>;
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
