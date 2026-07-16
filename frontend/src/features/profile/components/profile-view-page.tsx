'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { useI18n } from '@/lib/i18n/context';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/sonner';
import { useEffect, useState } from 'react';
import { getUser, setUser as storeUser } from '@/features/restaurant/lib/auth-store';
import { authUpdateProfile, authChangePassword } from '@/features/restaurant/api/service';
import type { User } from '@/features/restaurant/api/types';

export default function ProfileViewPage() {
  const [user, setUserState] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const toast = useToast();
  const { t } = useI18n();

  useEffect(() => {
    setUserState(getUser());
  }, []);

  function startEditing() {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await authUpdateProfile({ name, email });
      storeUser(updated);
      setUserState(updated);
      setEditing(false);
    } catch {
      // error shown via toast or inline
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <PageContainer pageTitle='Profile'>
        <div className='flex h-full items-center justify-center'>
          <p className='text-muted-foreground'>{t.profileView.pleaseSignIn}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer pageTitle={t.profile.title} pageDescription={t.common.description}>
      <div className='space-y-6 max-w-2xl'>
        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between border-b border-border/50 bg-muted/20'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-primary/10 p-2.5'>
                <Icons.user className='w-5 h-5 text-primary' />
              </div>
              <div>
                <CardTitle className='text-base'>{t.profileView.accountInfo}</CardTitle>
                <CardDescription>{t.profileView.accountDesc}</CardDescription>
              </div>
            </div>
            {!editing && (
              <Button variant='outline' size='sm' onClick={startEditing} className='shadow-xs'>
                <Icons.edit className='mr-1.5 h-3.5 w-3.5' />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className='space-y-5 pt-5'>
            <div className='grid gap-5 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-foreground/70 uppercase tracking-wide'>Name</Label>
                <Input
                  value={editing ? name : user.name || ''}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted/30 ring-1 ring-border/50' : ''}
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-foreground/70 uppercase tracking-wide'>Email</Label>
                <Input
                  value={editing ? email : user.email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted/30 ring-1 ring-border/50' : ''}
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-foreground/70 uppercase tracking-wide'>Role</Label>
                <div className='flex h-9 w-full items-center rounded-lg bg-muted/30 px-3 ring-1 ring-border/50 text-sm font-medium capitalize'>
                  {user.role || 'user'}
                </div>
              </div>
            </div>
            {editing && (
              <div className='flex gap-3 pt-2 border-t border-border/50'>
                <Button onClick={save} isLoading={saving} size='sm'>
                  <Icons.check className='mr-1.5 h-4 w-4' />
                  Save
                </Button>
                <Button variant='outline' size='sm' onClick={cancelEditing} disabled={saving}>
                  <Icons.close className='mr-1.5 h-4 w-4' />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardHeader className='border-b border-border/50 bg-muted/20'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-amber-100 p-2.5'>
                <Icons.lock className='w-5 h-5 text-amber-600' />
              </div>
              <div>
                <CardTitle className='text-base'>{t.profileView.changePasswordCard}</CardTitle>
                <CardDescription>{t.profileView.pwDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-5 pt-5'>
            <div className='grid gap-5 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-foreground/70 uppercase tracking-wide'>Current Password</Label>
                <Input
                  type='password'
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-foreground/70 uppercase tracking-wide'>New Password</Label>
                <Input type='password' value={pwNew} onChange={(e) => setPwNew(e.target.value)} />
              </div>
            </div>
            <div className='flex justify-end pt-2 border-t border-border/50'>
              <Button
                size='sm'
                isLoading={pwSaving}
                disabled={!pwCurrent || !pwNew}
                onClick={async () => {
                  setPwSaving(true);
                  try {
                    await authChangePassword({ currentPassword: pwCurrent, newPassword: pwNew });
                    toast.success(t.profile.passwordChanged);
                    setPwCurrent('');
                    setPwNew('');
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : t.common.error);
                  } finally {
                    setPwSaving(false);
                  }
                }}
              >
                <Icons.lock className='mr-1.5 h-4 w-4' />
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
