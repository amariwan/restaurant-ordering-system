'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/sonner';
import { reservationsCreate } from '@/features/restaurant/api/service';
import Link from 'next/link';

export default function ReservePage() {
  const toast = useToast();
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    guestCount: 2,
    reservationTime: '',
    note: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await reservationsCreate({
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        guestCount: form.guestCount,
        reservationTime: new Date(form.reservationTime).toISOString(),
        note: form.note.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold">{t.landingPage.reservationSubmitted}</h1>
          <p className="text-muted-foreground mb-6">
            Your reservation request has been received. We will confirm it shortly.
          </p>
          <Button asChild variant="outline">
            <Link href="/"><span className="mr-1">←</span> {t.landingPage.backHome}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold">{t.reservePage.title}</h1>
        <p className="text-muted-foreground mb-6">{t.reservePage.subtitle}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t.reservePage.name}</Label>
            <Input id="name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t.reservePage.email}</Label>
            <Input id="email" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">{t.reservePage.phone}</Label>
            <Input id="phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input id="guests" type="number" min={1} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time">Date & Time</Label>
            <Input id="time" type="datetime-local" value={form.reservationTime} onChange={(e) => setForm({ ...form, reservationTime: e.target.value })} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Special Requests (optional)</Label>
            <Input id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>
            Submit Reservation
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button asChild variant="link">
            <Link href="/"><span className="mr-1">←</span> {t.landingPage.backHome}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
