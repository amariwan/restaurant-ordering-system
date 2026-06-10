import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import { DEFAULT_THEME, THEMES } from '@/components/themes/theme.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../styles/globals.css';
import LayoutSelector from '@/components/layout/layout-selector';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  title: 'Restaurant Ordering System',
  description: 'A restaurant ordering and operations dashboard for staff, kitchen, and management.'
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: META_THEME_COLORS.light },
    { media: '(prefers-color-scheme: dark)', color: META_THEME_COLORS.dark }
  ]
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;

  const themeToApply: string = THEMES.some((t) => t.value === activeThemeValue)
    ? (activeThemeValue as string)
    : DEFAULT_THEME;

  return (
    <html lang='en' suppressHydrationWarning data-theme={themeToApply}>
      <head>
        <Script src='/theme-init.js' strategy='beforeInteractive' />
        <meta name='theme-color' content={META_THEME_COLORS.light} />
      </head>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontVariables
        )}
      >
        <NextTopLoader color='var(--primary)' showSpinner={false} />
        <NuqsAdapter>
          <ThemeProvider disableTransitionOnChange enableColorScheme>
            <Providers activeThemeValue={themeToApply}>
              <Toaster />
              <LayoutSelector>{children}</LayoutSelector>
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
