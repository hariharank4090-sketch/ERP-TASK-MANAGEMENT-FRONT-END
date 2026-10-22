import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLink } from '../../src/Components/customFetch';

describe('customFetch (fetchLink)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('makes request with Authorization header and parses response', async () => {
    localStorage.setItem('token', 'test-bearer-token');

    const mockResponseData = {
      success: true,
      data: [{ id: 1, name: 'Item 1' }],
      message: 'Success',
      totalRecords: 1,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponseData),
    });
    globalThis.fetch = mockFetch;

    const result = await fetchLink({
      address: 'masters/items',
      method: 'GET',
    });

    expect(mockFetch).toHaveBeenCalled();
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
    expect(calledUrl).toContain('masters/items');
    expect(calledOptions.headers.Authorization).toBe('Bearer test-bearer-token');
    expect(result.data).toEqual([{ id: 1, name: 'Item 1' }]);
  });

  it('handles loadingOn and loadingOff callbacks', async () => {
    const loadingOnMock = vi.fn();
    const loadingOffMock = vi.fn();

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await fetchLink({
      address: 'test',
      loadingOn: loadingOnMock,
      loadingOff: loadingOffMock,
    });

    expect(loadingOnMock).toHaveBeenCalledTimes(1);
    expect(loadingOffMock).toHaveBeenCalledTimes(1);
  });
});
