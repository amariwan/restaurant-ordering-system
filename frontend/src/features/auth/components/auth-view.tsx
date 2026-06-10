'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from '@/lib/auth/client';
import { authRegister } from '@/features/restaurant/api/service';
import { InteractiveGridPattern } from './interactive-grid';
import { signInSchema, signUpSchema } from '@/features/auth/lib/schemas';

type Mode = 'signin' | 'signup';
const AUTH_MODES: Record<Mode, string> = { signin: 'Sign In', signup: 'Register' };

export default function AuthView() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('signin');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  function startTransition(cb: () => Promise<void>) {
    setIsPending(true);
    cb().finally(() => setIsPending(false));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);

    if (mode === 'signin') {
      const result = signInSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password')
      });
      if (!result.success) {
        setError('Please enter a valid email and password.');
        return;
      }
      startTransition(async () => {
        const response = await signIn('credentials', {
          email: result.data.email,
          password: result.data.password,
          redirect: false
        });
        if (response?.error) {
          setError('Invalid email or password.');
          return;
        }
        router.push('/orders');
        router.refresh();
      });
    } else {
      const result = signUpSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
      });
      if (!result.success) {
        setError(result.error.issues[0]?.message || 'Please fix the errors.');
        return;
      }
      startTransition(async () => {
        try {
          await authRegister({
            name: result.data.name,
            email: result.data.email,
            password: result.data.password
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Registration failed.');
          return;
        }
        const response = await signIn('credentials', {
          email: result.data.email,
          password: result.data.password,
          redirect: false
        });
        if (response?.error) {
          setError('Failed to sign in after registration.');
          return;
        }
        router.push('/orders');
        router.refresh();
      });
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center text-lg font-medium'>
          {t.authView.title}
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              {mode === 'signin' ? t.authView.accessStaffWorkflow : t.authView.createAccountText}
            </p>
            <footer className='text-sidebar-foreground/70 text-sm'>Restaurant Operations</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='flex items-center gap-2 rounded-lg border p-1 bg-muted/50'>
            <button
              type='button'
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                mode === 'signin'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {AUTH_MODES[mode]}
            </button>
            <button
              type='button'
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                mode === 'signup'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {AUTH_MODES[mode]}
            </button>
          </div>

          <form onSubmit={onSubmit} className='space-y-4 w-full'>
            {mode === 'signup' && (
              <div className='space-y-2'>
                <Label htmlFor='name'>{t.authView.name}</Label>
                <Input id='name' name='name' required placeholder='John Doe' />
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' name='email' type='email' required placeholder='you@example.com' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input id='password' name='password' type='password' required />
            </div>
            {mode === 'signup' && (
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>{t.authView.confirmPassword}</Label>
                <Input id='confirmPassword' name='confirmPassword' type='password' required />
              </div>
            )}
            {error && <p className='text-destructive text-sm text-center'>{error}</p>}
            <Button type='submit' className='w-full' isLoading={isPending}>
              {AUTH_MODES[mode]}
            </Button>
          </form>

          <p className='text-muted-foreground px-8 text-center text-sm'>
            {t.authView.termsPrivacy}{' '}
            <Link
              href='/terms-of-service'
              className='hover:text-primary underline underline-offset-4'
            >
              {t.authView.termsOfService}
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy-policy'
              className='hover:text-primary underline underline-offset-4'
            >
              {t.authView.privacyPolicy}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
