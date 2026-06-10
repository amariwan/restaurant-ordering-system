import { describe, it, expect } from 'vitest';
import { profileSchema } from './form-schema';

describe('profileSchema', () => {
  it('accepts valid profile data', () => {
    const result = profileSchema.safeParse({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      contactno: 1234567890,
      country: 'US',
      city: 'NYC',
      jobs: []
    });
    expect(result.success).toBe(true);
  });

  it('rejects short firstname', () => {
    const result = profileSchema.safeParse({
      firstname: 'Jo',
      lastname: 'Doe',
      email: 'john@example.com',
      contactno: 1234567890,
      country: 'US',
      city: 'NYC',
      jobs: []
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = profileSchema.safeParse({
      firstname: 'John',
      lastname: 'Doe',
      email: 'bad',
      contactno: 1234567890,
      country: 'US',
      city: 'NYC',
      jobs: []
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty country', () => {
    const result = profileSchema.safeParse({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      contactno: 1234567890,
      country: '',
      city: 'NYC',
      jobs: []
    });
    expect(result.success).toBe(false);
  });

  it('validates job entries', () => {
    const result = profileSchema.safeParse({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      contactno: 1234567890,
      country: 'US',
      city: 'NYC',
      jobs: [
        {
          jobcountry: 'US',
          jobcity: 'SF',
          jobtitle: 'Engineer',
          employer: 'Acme',
          startdate: '2020-01-01',
          enddate: '2023-01-01'
        }
      ]
    });
    expect(result.success).toBe(true);
  });

  it('rejects job with invalid date format', () => {
    const result = profileSchema.safeParse({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      contactno: 1234567890,
      country: 'US',
      city: 'NYC',
      jobs: [
        {
          jobcountry: 'US',
          jobcity: 'SF',
          jobtitle: 'Engineer',
          employer: 'Acme',
          startdate: '01-01-2020',
          enddate: '01-01-2023'
        }
      ]
    });
    expect(result.success).toBe(false);
  });
});
