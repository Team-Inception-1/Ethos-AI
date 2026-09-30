'use client';
import { useCallback, useSyncExternalStore } from 'react';

const memory = new Map<string, string>();
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('ethos-preferences', listener);
  window.addEventListener('ethos-lang-change', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('ethos-preferences', listener);
    window.removeEventListener('ethos-lang-change', listener);
  };
}
function read(key: string): string | null {
  try { return window.localStorage.getItem(key) ?? memory.get(key) ?? null; }
  catch { return memory.get(key) ?? null; }
}
function write(key: string, value: string) {
  memory.set(key, value);
  try { window.localStorage.setItem(key, value); } catch { /* Keep this tab's preference when storage is unavailable. */ }
  window.dispatchEvent(new Event('ethos-preferences'));
  if (key === 'ethos-lang') window.dispatchEvent(new CustomEvent('ethos-lang-change', { detail: value }));
}
export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, () => read('ethos-lang') === 'bn' ? 'bn' : 'en', () => 'en' as const);
  return [lang, useCallback((value: 'en' | 'bn') => write('ethos-lang', value), [])] as const;
}
export function useStoredTheme() {
  const theme = useSyncExternalStore(subscribe, () => read('ethos-theme') === 'light' ? 'light' : 'dark', () => 'dark' as const);
  return [theme, useCallback((value: 'light' | 'dark') => write('ethos-theme', value), [])] as const;
}
function subscribeLocation(listener: () => void) {
  window.addEventListener('popstate', listener);
  const timer = window.setInterval(listener, 200);
  return () => { window.removeEventListener('popstate', listener); window.clearInterval(timer); };
}
export function useBrowserSearch() {
  return useSyncExternalStore(subscribeLocation, () => window.location.search, () => '');
}
