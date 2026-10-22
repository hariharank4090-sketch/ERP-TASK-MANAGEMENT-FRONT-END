import { describe, it, expect } from 'vitest';
import { appRoutes } from '../../src/routes/indexRouter';

describe('indexRouter route configuration', () => {
  it('combines and exports application routes properly', () => {
    expect(Array.isArray(appRoutes)).toBe(true);
    expect(appRoutes.length).toBeGreaterThan(0);

    // Verify key paths exist
    const paths = appRoutes.map((r) => r.path);
    expect(paths).toContain('/all');
    expect(paths).toContain('/notifications');
  });

  it('ensures each route definition contains valid path and component', () => {
    appRoutes.forEach((route) => {
      expect(typeof route.path).toBe('string');
      expect(route.component).toBeDefined();
    });
  });
});
