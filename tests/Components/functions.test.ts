import { describe, it, expect, beforeEach } from 'vitest';
import { isValidJSON, getSessionUser } from '../../src/Components/functions';

describe('functions utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates JSON strings correctly', () => {
    expect(isValidJSON('{"a":1}')).toBe(true);
    expect(isValidJSON('[1,2,3]')).toBe(true);
    expect(isValidJSON('not a json')).toBe(false);
    expect(isValidJSON('')).toBe(false);
  });

  it('retrieves user from session storage safely', () => {
    expect(getSessionUser().user).toEqual({});

    localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'Super' }));
    const session = getSessionUser();
    expect(session.user).toEqual({ name: 'Admin', role: 'Super' });
  });
});
