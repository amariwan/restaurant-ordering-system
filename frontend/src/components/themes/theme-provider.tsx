'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeProviderProps {
  children: ReactNode;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme?: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
  systemTheme?: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    if (stored === null) return null;
    localStorage.removeItem('theme');
    return null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch {}
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

function applyColorScheme(resolved: ResolvedTheme) {
  document.documentElement.style.colorScheme = resolved;
}

function disableTransitions() {
  const css = document.createElement('style');
  css.id = 'theme-transition-disable';
  css.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important}';
  document.head.appendChild(css);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById('theme-transition-disable');
      if (el) el.remove();
    });
  });
}

export default function ThemeProvider({
  children,
  disableTransitionOnChange = false,
  enableColorScheme = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  const resolveAndApply = useCallback((t: Theme, disableTransition: boolean) => {
    const resolved = t === 'system' ? getSystemTheme() : t;
    if (disableTransition) disableTransitions();
    applyThemeClass(resolved);
    if (enableColorScheme) applyColorScheme(resolved);
    return resolved;
  }, [enableColorScheme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    storeTheme(t);
    resolveAndApply(t, disableTransitionOnChange);
  }, [disableTransitionOnChange, resolveAndApply]);

  useEffect(() => {
    setMounted(true);
    setSystemTheme(getSystemTheme());

    const stored = getStoredTheme();
    const initial = stored || 'system';
    setThemeState(initial);
    resolveAndApply(initial, false);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
      const current = getStoredTheme();
      if (!current || current === 'system') {
        applyThemeClass(e.matches ? 'dark' : 'light');
        if (enableColorScheme) applyColorScheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [resolveAndApply, enableColorScheme]);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: mounted ? resolvedTheme : undefined,
        setTheme,
        themes: ['light', 'dark', 'system'],
        systemTheme: mounted ? systemTheme : undefined,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
