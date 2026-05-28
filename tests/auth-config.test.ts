import { describe, expect, it } from 'vitest';
import { authOptions } from '@/lib/auth';

describe('auth config', () => {
  it('provides a local demo secret when the database is not configured', () => {
    expect(authOptions.secret).toBeTruthy();
  });
});
