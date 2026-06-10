import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GithubSignInButton from './github-auth-button';

describe('GithubSignInButton', () => {
  it('renders a button', () => {
    render(<GithubSignInButton />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('displays "Continue with Github" text', () => {
    render(<GithubSignInButton />);
    expect(screen.getByText('Continue with Github')).toBeDefined();
  });

  it('has outline variant', () => {
    render(<GithubSignInButton />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('outline');
  });

  it('is full width', () => {
    render(<GithubSignInButton />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });
});
