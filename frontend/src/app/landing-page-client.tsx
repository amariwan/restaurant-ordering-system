'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { InteractiveGridPattern } from '@/features/auth/components/interactive-grid';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';

const FEATURES = [
  {
    icon: Icons.pizza,
    title: 'Menu Management',
    description:
      'Full CRUD for menu items and categories with availability toggles and image upload.',
    roles: ['Admin']
  },
  {
    icon: Icons.cart,
    title: 'Order Processing',
    description: 'Create, modify, and track orders from table selection through payment.',
    roles: ['Waiter']
  },
  {
    icon: Icons.clock,
    title: 'Live Kitchen View',
    description:
      'Real-time order queue with status updates. Mark items preparing → ready as you go.',
    roles: ['Kitchen']
  },
  {
    icon: Icons.table,
    title: 'Table Management',
    description:
      'Visual table grid with free / occupied / reserved states and assignment tracking.',
    roles: ['Admin', 'Waiter']
  },
  {
    icon: Icons.billing,
    title: 'Payment Tracking',
    description:
      'Split bills, accept partial payments, and track cash or card transactions per order.',
    roles: ['Admin', 'Waiter']
  },
  {
    icon: Icons.trendingUp,
    title: 'Insights & Analytics',
    description: 'Dashboard with revenue charts, order volume, and user activity breakdowns.',
    roles: ['Admin']
  }
];

const ROLE_HIGHLIGHTS = [
  {
    role: 'Waiter',
    desc: 'Take orders, manage tables, process payments from a unified dashboard.'
  },
  {
    role: 'Kitchen',
    desc: 'See incoming orders in real time, update preparation status, coordinate the line.'
  },
  {
    role: 'Admin',
    desc: 'Full control over menu, staff, tables, reports, and system configuration.'
  }
];

const DECORATIVE_ICONS = [
  { Icon: Icons.pizza, x: '15%', y: '20%', delay: 0, size: 28 },
  { Icon: Icons.sparkles, x: '85%', y: '25%', delay: 0.5, size: 24 },
  { Icon: Icons.notification, x: '75%', y: '70%', delay: 1, size: 22 },
  { Icon: Icons.clock, x: '20%', y: '75%', delay: 1.5, size: 26 }
];

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='mb-16 text-center'
    >
      <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>{title}</h2>
      {subtitle && (
        <p className='text-muted-foreground mx-auto mt-4 max-w-xl text-lg'>{subtitle}</p>
      )}
    </motion.div>
  );
}

function FadeInSection({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  const Icon = feature.icon;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className='group relative rounded-xl border bg-card p-6 transition-shadow duration-300 hover:shadow-lg'
    >
      <div className='mb-4 flex size-10 items-center justify-center rounded-lg border bg-background text-foreground transition-all duration-300 group-hover:border-primary/30 group-hover:text-primary group-hover:bg-primary/5'>
        <Icon className='size-5' />
      </div>
      <h3 className='mb-2 font-semibold'>{feature.title}</h3>
      <p className='text-muted-foreground mb-3 text-sm leading-relaxed'>{feature.description}</p>
      <div className='flex flex-wrap gap-1.5'>
        {feature.roles.map((role) => (
          <span
            key={role}
            className='inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground'
          >
            {role}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function LandingPageClient() {
  const router = useRouter();
  const { t } = useI18n();
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart_tableId');
      if (saved) setTableNumber(saved);
    }
  }, []);

  const handleBrowseMenu = () => {
    if (!tableNumber.trim()) {
      setTableDialogOpen(true);
      return;
    }
    router.push(`/menu?tableId=${encodeURIComponent(tableNumber.trim())}`);
  };

  const handleTableConfirm = () => {
    if (tableNumber.trim()) {
      localStorage.setItem('cart_tableId', tableNumber.trim());
      setTableDialogOpen(false);
      router.push(`/menu?tableId=${encodeURIComponent(tableNumber.trim())}`);
    }
  };

  return (
    <div className='relative min-h-screen overflow-hidden'>
      <InteractiveGridPattern className='absolute inset-0 opacity-[0.12] dark:opacity-[0.06]' />

      {/* Floating Decorative Icons */}
      <div className='pointer-events-none absolute inset-0 z-0 hidden lg:block' aria-hidden='true'>
        {DECORATIVE_ICONS.map(({ Icon, x, y, delay, size }) => (
          <motion.div
            key={`deco-${delay}`}
            className='absolute text-muted-foreground/20'
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -12, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              opacity: { duration: 1, delay },
              scale: { duration: 1, delay },
              y: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay * 0.5
              },
              rotate: {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay * 0.5
              }
            }}
          >
            <Icon style={{ width: size, height: size }} />
          </motion.div>
        ))}
      </div>

      {/* Hero */}
      <section className='relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-4 pt-24 text-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className='mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm'
        >
          <Icons.pizza className='size-7 text-primary' />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className='mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl'
        >
          Restaurant{' '}
          <span className='bg-gradient-to-r from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent'>
            Ordering System
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl'
        >
          {t.landing.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
          className='mt-10 flex flex-wrap items-center justify-center gap-4'
        >
          <Button size='lg' className='group gap-2 shadow-sm' onClick={handleBrowseMenu}>
            {t.landing.browseMenu}
            <Icons.arrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
          </Button>
          <Button asChild variant='outline' size='lg'>
            <Link href='/login'>{t.landing.staffSignIn}</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className='mt-4 flex items-center gap-4'
        >
          <Button asChild variant='link' size='sm'>
            <Link href='/reserve' className='gap-1.5'>
              <Icons.calendar className='size-4' />
              {t.landing.makeReservation}
            </Link>
          </Button>
          <Button asChild variant='link' size='sm'>
            <Link href='/login' className='gap-1.5'>
              {t.landing.createAccount}
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className='relative z-10 border-t bg-card/50 px-4 py-24 backdrop-blur-sm'>
        <div className='mx-auto max-w-6xl'>
          <SectionTitle title={t.landing.designedFor} subtitle={t.landing.designedSub} />

          <div className='grid gap-6 md:grid-cols-3'>
            {ROLE_HIGHLIGHTS.map((item, i) => {
              const icons = [Icons.user, Icons.pizza, Icons.settings];
              const Icon = icons[i];
              return (
                <motion.div
                  key={item.role}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.12 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className='relative rounded-xl border bg-card p-8 text-center transition-shadow duration-300 hover:shadow-md'
                >
                  <div className='mx-auto mb-5 flex size-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 text-primary transition-colors duration-300 group-hover:bg-primary/10'>
                    <Icon className='size-6' />
                  </div>
                  <h3 className='mb-1 text-lg font-semibold'>{item.role}</h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='relative z-10 border-t px-4 py-24'>
        <div className='mx-auto max-w-6xl'>
          <SectionTitle
            title={t.landing.everythingYouNeed}
            subtitle={t.landing.everythingSub}
          />

          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='relative z-10 border-t bg-card/50 px-4 py-24 backdrop-blur-sm'>
        <div className='mx-auto max-w-2xl text-center'>
          <FadeInSection>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              {t.landing.readyToOrder}
            </h2>
            <p className='text-muted-foreground mx-auto mt-4 text-lg'>{t.landing.readySub}</p>
            <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
              <Button size='lg' className='group gap-2 shadow-sm' onClick={handleBrowseMenu}>
                {t.landing.browseMenu}
                <Icons.arrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
              </Button>
              <Button asChild variant='outline' size='lg'>
                <Link href='/login'>Staff Login</Link>
              </Button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative z-10 border-t px-4 py-12'>
        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center text-sm text-muted-foreground sm:flex-row sm:text-left'>
          <div className='flex items-center gap-2'>
            <div className='flex size-8 items-center justify-center rounded-lg border bg-card'>
              <Icons.pizza className='size-4' />
            </div>
            <span className='font-semibold text-foreground'>Restaurant OS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Restaurant Ordering System. All rights reserved.</p>
          <div className='flex items-center gap-6'>
            <Link href='/menu' className='hover:text-foreground transition-colors'>
              Menu
            </Link>
            <Link href='/login' className='hover:text-foreground transition-colors'>
              Sign In
            </Link>
            <Link href='/reserve' className='hover:text-foreground transition-colors'>
              Reserve
            </Link>
          </div>
        </div>
      </footer>

      {/* Table Selection Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t.landingPage.tableDialogTitle}</DialogTitle>
            <DialogDescription>{t.landingPage.tableDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Input
              type='number'
              min={1}
              placeholder={t.landingPage.tablePlaceholder}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTableConfirm();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTableDialogOpen(false)}>
              {t.landingPage.cancel}
            </Button>
            <Button onClick={handleTableConfirm} disabled={!tableNumber.trim()}>
              {t.landingPage.confirmTable}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
