import { describe, it, expect } from 'vitest';
import {
  ddmmyyyy,
  yyyymmdd,
  isValidDate,
  isValidObject,
  isArray,
  toArray,
  rid,
  onlynum,
  onlynumAndNegative,
} from '../../src/utils/helper';

describe('helper utilities', () => {
  it('formats dates with yyyymmdd and ddmmyyyy', () => {
    const fixedDate = new Date('2026-05-15T10:00:00Z');
    expect(yyyymmdd(fixedDate)).toBe('2026-05-15');
    const formatted = ddmmyyyy(fixedDate);
    expect(formatted).toMatch(/15.*05.*2026/);
  });

  it('validates dates correctly', () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date('invalid'))).toBe(false);
    expect(isValidDate('not a date')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });

  it('validates objects and arrays', () => {
    expect(isValidObject({ a: 1 })).toBe(true);
    expect(isValidObject({})).toBe(false);
    expect(isValidObject(null)).toBe(false);

    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray('string')).toBe(false);

    expect(toArray([1, 2])).toEqual([1, 2]);
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
  });

  it('generates random ids with rid', () => {
    const id1 = rid();
    const id2 = rid();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('sanitizes inputs using onlynum and onlynumAndNegative', () => {
    const event1 = { target: { value: 'abc12.34xyz' } };
    onlynum(event1);
    expect(event1.target.value).toBe('12.34');

    const event2 = { target: { value: '-12.34' } };
    onlynumAndNegative(event2);
    expect(event2.target.value).toBe('-12.34');
  });
});
