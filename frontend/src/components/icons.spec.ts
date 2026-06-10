import { describe, it, expect } from 'vitest';
import { Icons } from './icons';

describe('Icons', () => {
  it('exports general icons', () => {
    expect(Icons.alertCircle).toBeDefined();
    expect(Icons.check).toBeDefined();
    expect(Icons.close).toBeDefined();
    expect(Icons.search).toBeDefined();
    expect(Icons.settings).toBeDefined();
    expect(Icons.trash).toBeDefined();
    expect(Icons.spinner).toBeDefined();
    expect(Icons.info).toBeDefined();
  });

  it('exports navigation icons', () => {
    expect(Icons.chevronDown).toBeDefined();
    expect(Icons.chevronUp).toBeDefined();
    expect(Icons.chevronLeft).toBeDefined();
    expect(Icons.chevronRight).toBeDefined();
  });

  it('exports layout icons', () => {
    expect(Icons.dashboard).toBeDefined();
    expect(Icons.kanban).toBeDefined();
    expect(Icons.panelLeft).toBeDefined();
  });

  it('exports user icons', () => {
    expect(Icons.user).toBeDefined();
    expect(Icons.teams).toBeDefined();
    expect(Icons.profile).toBeDefined();
  });

  it('exports brand icons', () => {
    expect(Icons.github).toBeDefined();
    expect(Icons.twitter).toBeDefined();
  });

  it('exports communication icons', () => {
    expect(Icons.chat).toBeDefined();
    expect(Icons.notification).toBeDefined();
    expect(Icons.send).toBeDefined();
  });

  it('exports file icons', () => {
    expect(Icons.media).toBeDefined();
    expect(Icons.page).toBeDefined();
    expect(Icons.fileTypePdf).toBeDefined();
  });

  it('exports action icons', () => {
    expect(Icons.add).toBeDefined();
    expect(Icons.edit).toBeDefined();
    expect(Icons.upload).toBeDefined();
    expect(Icons.trash).toBeDefined();
  });

  it('exports theme icons', () => {
    expect(Icons.sun).toBeDefined();
    expect(Icons.moon).toBeDefined();
    expect(Icons.palette).toBeDefined();
  });

  it('exports commerce icons', () => {
    expect(Icons.billing).toBeDefined();
    expect(Icons.pro).toBeDefined();
    expect(Icons.exclusive).toBeDefined();
  });

  it('exports chart icons', () => {
    expect(Icons.trendingUp).toBeDefined();
    expect(Icons.trendingDown).toBeDefined();
  });

  it('exports toast icons', () => {
    expect(Icons.toastSuccess).toBeDefined();
    expect(Icons.toastInfo).toBeDefined();
    expect(Icons.toastWarning).toBeDefined();
    expect(Icons.toastError).toBeDefined();
  });

  it('exports restaurant icons', () => {
    expect(Icons.cart).toBeDefined();
    expect(Icons.table).toBeDefined();
    expect(Icons.pizza).toBeDefined();
  });

  it('all exports are React components or objects', () => {
    for (const [_key, value] of Object.entries(Icons)) {
      expect(['function', 'object']).toContain(typeof value);
    }
  });
});
