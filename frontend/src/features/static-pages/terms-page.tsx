'use client';

import { useI18n } from '@/lib/i18n/context';

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <div className='mx-auto max-w-3xl space-y-8'>
      <div className='text-center'>
        <p className='text-muted-foreground mt-2 text-sm'>Last updated:{' '}{new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</p>
      </div>
      <section><h2 className='text-foreground mb-3 text-xl font-semibold'>{t.staticTerms.introTitle}</h2><p className='text-muted-foreground text-base leading-relaxed'>{t.staticTerms.introDesc}</p></section>
      <section><h2 className='text-foreground mb-3 text-xl font-semibold'>{t.staticTerms.acceptableTitle}</h2><p className='text-muted-foreground text-base leading-relaxed'>{t.staticTerms.acceptableDesc}</p></section>
      <section><h2 className='text-foreground mb-3 text-xl font-semibold'>{t.staticTerms.warrantyTitle}</h2><p className='text-muted-foreground text-base leading-relaxed'>{t.staticTerms.warrantyDesc}</p></section>
      <section><h2 className='text-foreground mb-3 text-xl font-semibold'>{t.staticTerms.dataTitle}</h2><p className='text-muted-foreground text-base leading-relaxed'>{t.staticTerms.dataDesc}</p></section>
      <section className='border-border border-t pt-4'><p className='text-muted-foreground text-center text-sm'>{t.staticTerms.updateText}</p></section>
    </div>
  );
}
