import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileViewPage from './profile-view-page';

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  getUser: vi.fn()
}));

import { getUser } from '@/features/restaurant/lib/auth-store';

describe('ProfileViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign-in prompt when no user', () => {
    vi.mocked(getUser).mockReturnValue(null);
    render(<ProfileViewPage />);
    expect(screen.getByText('Please sign in to view your profile.')).toBeDefined();
  });

  it('renders user profile when user exists', () => {
    vi.mocked(getUser).mockReturnValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'Admin'
    });
    render(<ProfileViewPage />);
    expect(screen.getByText('Account Information')).toBeDefined();
    expect(screen.getByDisplayValue('Test User')).toBeDefined();
    expect(screen.getByDisplayValue('test@example.com')).toBeDefined();
    expect(screen.getByDisplayValue('Admin')).toBeDefined();
  });

  it('calls getUser on mount', () => {
    vi.mocked(getUser).mockReturnValue(null);
    render(<ProfileViewPage />);
    expect(getUser).toHaveBeenCalledOnce();
  });
});
