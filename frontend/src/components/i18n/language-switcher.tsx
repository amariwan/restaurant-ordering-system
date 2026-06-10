'use client';

import { useI18n } from '@/lib/i18n/context';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 px-2'>
          <Icons.languages className='size-4' />
          <span className='text-xs font-medium'>{LOCALE_LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-28'>
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => l !== locale && setLocale(l)}
            aria-checked={locale === l}
            className='gap-2'
          >
            <span className='flex size-4 shrink-0 items-center justify-center'>
              {locale === l && <Icons.check className='size-3.5' />}
            </span>
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
