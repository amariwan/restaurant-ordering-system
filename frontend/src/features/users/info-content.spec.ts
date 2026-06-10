import { describe, it, expect } from 'vitest';
import { usersInfoContent } from './info-content';

describe('usersInfoContent', () => {
  it('has title', () => {
    expect(usersInfoContent.title).toBe('Users — React Query + nuqs Pattern');
  });

  it('has 4 sections', () => {
    expect(usersInfoContent.sections).toHaveLength(4);
  });

  it('section 0 is Overview', () => {
    const section = usersInfoContent.sections[0];
    expect(section.title).toBe('Overview');
    expect(section.links).toHaveLength(1);
    expect(section.links![0].title).toBe('TanStack Query SSR Docs');
  });

  it('section 1 is Server Prefetch', () => {
    expect(usersInfoContent.sections[1].title).toBe('Server Prefetch + Client Hydration');
    expect(usersInfoContent.sections[1].links).toHaveLength(0);
  });

  it('section 2 is URL State', () => {
    expect(usersInfoContent.sections[2].title).toBe('URL State with nuqs');
    expect(usersInfoContent.sections[2].links).toHaveLength(1);
    expect(usersInfoContent.sections[2].links![0].title).toBe('nuqs Documentation');
  });

  it('section 3 compares patterns', () => {
    expect(usersInfoContent.sections[3].title).toBe('Products vs Users Pattern');
    expect(usersInfoContent.sections[3].links).toHaveLength(0);
  });

  it('all sections have description', () => {
    for (const s of usersInfoContent.sections) {
      expect(s?.description).toBeTruthy();
    }
  });

  it('all sections with links have url', () => {
    for (const s of usersInfoContent.sections) {
      for (const link of s?.links ?? []) {
        expect(link.title).toBeTruthy();
        expect(link.url).toBeTruthy();
      }
    }
  });
});
