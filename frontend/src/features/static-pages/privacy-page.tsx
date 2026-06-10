'use client';

import { useI18n } from '@/lib/i18n/context';

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className='mx-auto max-w-3xl space-y-8'>
      <section>
        <h2 className='text-foreground mb-3 text-xl font-semibold'>{t.staticPrivacy.introTitle}</h2>
        <p className='text-muted-foreground text-base leading-relaxed'>
          {t.staticPrivacy.introDesc}
        </p>
      </section>

      <section>
        <h2 className='text-foreground mb-3 text-xl font-semibold'>
          {t.staticPrivacy.collectionTitle}
        </h2>
        <p className='text-muted-foreground text-base leading-relaxed'>
          {t.staticPrivacy.collectionDesc}
        </p>
      </section>

      <section>
        <h2 className='text-foreground mb-3 text-xl font-semibold'>{t.staticPrivacy.useTitle}</h2>
        <p className='text-muted-foreground text-base leading-relaxed'>{t.staticPrivacy.useDesc}</p>
      </section>

      <section>
        <h2 className='text-foreground mb-3 text-xl font-semibold'>
          {t.staticPrivacy.securityTitle}
        </h2>
        <p className='text-muted-foreground text-base leading-relaxed'>
          {t.staticPrivacy.securityDesc}
        </p>
      </section>

      <div className='border-border border-t pt-4'>
        <p className='text-muted-foreground text-sm'>Last updated: February 2026</p>
      </div>
    </div>
  );
}
