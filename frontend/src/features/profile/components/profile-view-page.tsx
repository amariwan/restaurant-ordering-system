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
    setUserState(getUser())
  }, [])

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
    } catch (err) {
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
      <div className='space-y-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>{t.profileView.accountInfo}</CardTitle>
              <CardDescription>{t.profileView.accountDesc}</CardDescription>
            </div>
            {!editing && (
              <Button variant='outline' size='sm' onClick={startEditing}>
                <Icons.edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Name</Label>
              <Input
                value={editing ? name : user.name || ''}
                onChange={(e) => setName(e.target.value)}
                readOnly={!editing}
              />
            </div>
            <div className='space-y-2'>
              <Label>Email</Label>
              <Input
                value={editing ? email : user.email || ''}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!editing}
              />
            </div>
            <div className='space-y-2'>
              <Label>Role</Label>
              <Input value={user.role || 'user'} readOnly />
            </div>
            {editing && (
              <div className='flex gap-2 pt-2'>
                <Button onClick={save} isLoading={saving}>
                  <Icons.check className='mr-2 h-4 w-4' />
                  Save
                </Button>
                <Button variant='outline' onClick={cancelEditing} disabled={saving}>
                  <Icons.close className='mr-2 h-4 w-4' />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.profileView.changePasswordCard}</CardTitle>
            <CardDescription>{t.profileView.pwDesc}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Current Password</Label>
              <Input type='password' value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label>New Password</Label>
              <Input type='password' value={pwNew} onChange={(e) => setPwNew(e.target.value)} />
            </div>
            <Button
              isLoading={pwSaving}
              disabled={!pwCurrent || !pwNew}
              onClick={async () => {
                setPwSaving(true);
                try {
                  await authChangePassword({ currentPassword: pwCurrent, newPassword: pwNew });
                  toast.success(t.profile.passwordChanged);
                  setPwCurrent('');
                  setPwNew('');
                } catch (err: any) {
                  toast.error(err?.message ?? t.common.error);
                } finally {
                  setPwSaving(false);
                }
              }}
            >
              <Icons.lock className='mr-2 h-4 w-4' />
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
