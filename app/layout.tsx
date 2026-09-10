import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Лепесток — цветы с чувством', description: 'Букеты для больших событий и маленьких знаков внимания.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
