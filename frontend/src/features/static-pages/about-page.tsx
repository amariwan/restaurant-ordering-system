'use client';

import { useI18n } from '@/lib/i18n/context';

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className='mx-auto max-w-3xl space-y-8'>
      <div className='text-center'>
        <p className='text-muted-foreground mt-4 text-lg'>{t.staticAbout.subtitle}</p>
      </div>

      <section className='bg-card rounded-2xl border p-8 shadow-sm'>
        <h2 className='text-foreground mb-4 text-xl font-semibold'>{t.staticAbout.whatWeDo}</h2>
        <p className='text-muted-foreground text-lg leading-relaxed'>
          {t.staticAbout.whatWeDoDesc}
        </p>
      </section>

      <section className='bg-card rounded-2xl border p-8 shadow-sm'>
        <h2 className='text-foreground mb-4 text-xl font-semibold'>
          {t.staticAbout.realtimeTitle}
        </h2>
        <p className='text-muted-foreground text-lg leading-relaxed'>
          {t.staticAbout.realtimeDesc}
        </p>
      </section>

      <section className='bg-card rounded-2xl border p-8 shadow-sm'>
        <h2 className='text-foreground mb-4 text-xl font-semibold'>
          {t.staticAbout.integrationTitle}
        </h2>
        <p className='text-muted-foreground text-lg leading-relaxed'>
          {t.staticAbout.integrationDesc}
        </p>
      </section>

      <div className='mt-12 text-center'>
        <p className='text-muted-foreground text-sm'>{t.staticAbout.footerText}</p>
      </div>
    </div>
  );
}
