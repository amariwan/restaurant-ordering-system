'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { InteractiveGridPattern } from '@/features/auth/components/interactive-grid';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';

const FEATURES = [
  {
    icon: Icons.pizza,
    title: 'Menu Management',
    description: 'Full CRUD for menu items and categories with availability toggles and image upload.',
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
    description: 'Real-time order queue with status updates. Mark items preparing → ready as you go.',
    roles: ['Kitchen']
  },
  {
    icon: Icons.table,
    title: 'Table Management',
    description: 'Visual table grid with free / occupied / reserved states and assignment tracking.',
    roles: ['Admin', 'Waiter']
  },
  {
    icon: Icons.billing,
    title: 'Payment Tracking',
    description: 'Split bills, accept partial payments, and track cash or card transactions per order.',
    roles: ['Admin', 'Waiter']
  },
  {
    icon: Icons.trendingUp,
    title: 'Insights & Analytics',
    description: 'Dashboard with revenue charts, order volume, and user activity breakdowns.',
    roles: ['Admin']
  },
];

const ROLE_HIGHLIGHTS = [
  { role: 'Waiter', desc: 'Take orders, manage tables, process payments from a unified dashboard.' },
  { role: 'Kitchen', desc: 'See incoming orders in real time, update preparation status, coordinate the line.' },
  { role: 'Admin', desc: 'Full control over menu, staff, tables, reports, and system configuration.' },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <div
      className="group relative rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-background text-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mb-2 font-semibold">{feature.title}</h3>
      <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{feature.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {feature.roles.map((role) => (
          <span
            key={role}
            className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
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
    <div className="relative min-h-screen">
      <InteractiveGridPattern className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]" />

      {/* Hero */}
      <section className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 pt-24 text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <Icons.pizza className="size-7 text-primary" />
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Restaurant{' '}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ordering System
          </span>
        </h1>

        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">
          {t.landing.subtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="gap-2" onClick={handleBrowseMenu}>
            {t.landing.browseMenu}
            <Icons.arrowRight className="size-4" />
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">{t.landing.staffSignIn}</Link>
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Button asChild variant="link" size="sm">
            <Link href="/reserve" className="gap-1.5">
              <Icons.calendar className="size-4" />
              {t.landing.makeReservation}
            </Link>
          </Button>
          <Button asChild variant="link" size="sm">
            <Link href="/login" className="gap-1.5">
              {t.landing.createAccount}
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 border-t bg-card/50 px-4 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.landing.designedFor}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
              {t.landing.designedSub}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {ROLE_HIGHLIGHTS.map((item, i) => {
              const icons = [Icons.user, Icons.pizza, Icons.settings];
              const Icon = icons[i];
              return (
                <div
                  key={item.role}
                  className="relative rounded-xl border bg-card p-8 text-center transition-all hover:shadow-sm"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{item.role}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-t px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.landing.everythingYouNeed}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
              {t.landing.everythingSub}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t bg-card/50 px-4 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.landing.readyToOrder}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 text-lg">
            {t.landing.readySub}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2" onClick={handleBrowseMenu}>
              {t.landing.browseMenu}
              <Icons.arrowRight className="size-4" />
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Staff Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <Icons.pizza className="size-4" />
            <span className="font-medium text-foreground">Restaurant OS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Restaurant Ordering System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/menu" className="hover:text-foreground transition-colors">Menu</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/reserve" className="hover:text-foreground transition-colors">Reserve</Link>
          </div>
        </div>
      </footer>

      {/* Table Selection Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.landingPage.tableDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.landingPage.tableDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              min={1}
              placeholder={t.landingPage.tablePlaceholder}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTableConfirm(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
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
