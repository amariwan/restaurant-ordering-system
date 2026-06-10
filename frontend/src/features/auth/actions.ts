'use server';

import { authRegister } from '@/features/restaurant/api/service';

export async function signUp(email: string, password: string, name: string) {
  try {
    await authRegister({ email, password, name });
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Registration failed' };
  }
}
