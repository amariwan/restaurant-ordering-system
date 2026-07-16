'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signIn } from '@/lib/auth/client';
import { authRegister } from '@/features/restaurant/api/service';
import { InteractiveGridPattern } from './interactive-grid';
import { signInSchema, signUpSchema } from '@/features/auth/lib/schemas';
import { Icons } from '@/components/icons';

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
      {/* Left Panel - Brand Side */}
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-sidebar/95' />
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(600px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-6 opacity-70'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 flex items-center gap-3 text-lg font-medium'>
          <div className='flex size-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-primary/10 shadow-sm'>
            <Icons.pizza className='size-5' />
          </div>
          {t.authView.title}
        </div>
        <div className='text-sidebar-foreground relative z-20 mt-auto max-w-sm'>
          <blockquote className='space-y-3'>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className='text-lg leading-relaxed font-light'
            >
              &ldquo;{mode === 'signin' ? t.authView.accessStaffWorkflow : t.authView.createAccountText}&rdquo;
            </motion.p>
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className='text-sidebar-foreground/60 text-sm font-medium'
            >
              — Restaurant Operations
            </motion.footer>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className='flex w-full max-w-md flex-col items-center justify-center space-y-8'
        >
          {/* Logo (mobile) */}
          <div className='flex flex-col items-center gap-3 lg:hidden'>
            <div className='flex size-12 items-center justify-center rounded-2xl border bg-card shadow-sm'>
              <Icons.pizza className='size-6 text-primary' />
            </div>
            <h1 className='text-xl font-bold tracking-tight'>{t.authView.title}</h1>
          </div>

          {/* Mode Toggle */}
          <div className='relative flex w-full rounded-xl border bg-muted/50 p-1 shadow-sm'>
            <div className='relative z-0 flex w-full'>
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type='button'
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={cn(
                    'relative z-10 flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200',
                    mode === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {AUTH_MODES[m]}
                </button>
              ))}
              <motion.div
                layoutId='auth-toggle'
                className='absolute top-0 left-0 z-0 h-full rounded-lg bg-background shadow-sm'
                initial={false}
                animate={{
                  x: mode === 'signin' ? '0%' : '100%',
                  width: '50%'
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className='w-full space-y-4'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className='space-y-4'
              >
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
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              >
                <Icons.alertCircle className='size-4 shrink-0' />
                {error}
              </motion.p>
            )}

            <Button type='submit' className='w-full shadow-sm' isLoading={isPending}>
              {AUTH_MODES[mode]}
            </Button>
          </form>

          <p className='text-muted-foreground px-8 text-center text-sm leading-relaxed'>
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
        </motion.div>
      </div>
    </div>
  );
}
