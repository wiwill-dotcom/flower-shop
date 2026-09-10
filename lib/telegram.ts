/** Official WebApp API surface used by this application. */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
  is_premium?: boolean;
  photo_url?: string;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
}
export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  button_text_color?: string;
}
export type TelegramEvent = 'themeChanged' | 'safeAreaChanged' | 'contentSafeAreaChanged' | 'viewportChanged';
export type Insets = { top: number; bottom: number; left: number; right: number };
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser };
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  safeAreaInset?: Insets;
  contentSafeAreaInset?: Insets;
  ready(): void;
  expand(): void;
  onEvent(event: TelegramEvent, handler: () => void): void;
  offEvent(event: TelegramEvent, handler: () => void): void;
}
declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}
export const defaultTheme = {
  backgroundColor: '#ffffff', textColor: '#30292c', hintColor: '#91868b',
  buttonColor: '#714358', buttonTextColor: '#ffffff',
};
export function getTheme(params: TelegramThemeParams) {
  const color = (value: string | undefined, fallback: string) =>
    value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return {
    backgroundColor: color(params.bg_color, defaultTheme.backgroundColor),
    textColor: color(params.text_color, defaultTheme.textColor),
    hintColor: color(params.hint_color, defaultTheme.hintColor),
    buttonColor: color(params.button_color, defaultTheme.buttonColor),
    buttonTextColor: color(params.button_text_color, defaultTheme.buttonTextColor),
  };
}
// UX hint only, never authentication. SDK exists in ordinary browsers too.
export function isTelegramLaunch(app: TelegramWebApp) {
  return Boolean(app.initData || (app.platform && app.platform !== 'unknown'));
}
