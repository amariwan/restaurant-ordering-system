'use client';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { ThemeSelector } from '../themes/theme-selector';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export default function Header() {
  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-md px-4 supports-[backdrop-filter]:bg-background/50'>
      <div className='flex items-center gap-2'>
        <SidebarTrigger className='-ms-1' />
        <Separator orientation='vertical' className='me-1 h-4' />
        <Breadcrumbs />
      </div>

      <div className='ms-auto flex items-center gap-2'>
        <div className='hidden md:block'>
          <SearchInput />
        </div>
        <ThemeModeToggle />
        <ThemeSelector />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
