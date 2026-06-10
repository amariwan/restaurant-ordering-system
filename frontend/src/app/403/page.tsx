import Link from 'next/link';

export const metadata = {
  title: 'Forbidden',
  description: 'You do not have access to this page.'
};

export default function ForbiddenPage() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='max-w-md text-center space-y-4'>
        <h1 className='text-3xl font-semibold'>403 — Zugriff verweigert</h1>
        <p className='text-muted-foreground'>Du hast keine Berechtigung, diese Seite anzusehen.</p>
        <div>
          <Link href='/' className='text-primary underline'>
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
