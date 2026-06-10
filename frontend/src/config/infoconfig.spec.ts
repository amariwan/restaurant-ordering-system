import { describe, it, expect } from 'vitest';
import { productInfoContent } from './infoconfig';

describe('productInfoContent', () => {
  it('has a title', () => {
    expect(productInfoContent.title).toBe('Product Management');
  });

  it('has multiple sections', () => {
    expect(productInfoContent.sections.length).toBeGreaterThan(0);
  });

  it('each section has title and description', () => {
    for (const section of productInfoContent.sections) {
      expect(section.title).toBeDefined();
      expect(section.description).toBeDefined();
      expect(section.links).toBeDefined();
    }
  });

  it('has all expected section titles', () => {
    const titles = productInfoContent.sections.map((s) => s.title);
    expect(titles).toContain('Overview');
    expect(titles).toContain('Adding Products');
    expect(titles).toContain('Editing Products');
    expect(titles).toContain('Deleting Products');
    expect(titles).toContain('Table Features');
    expect(titles).toContain('Product Fields');
  });
});
