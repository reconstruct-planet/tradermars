import { describe, expect, it } from 'vitest';
import { makeAuditMetadata, sanitizeAuditMetadata } from '../lib/admin-audit';

describe('admin audit metadata', () => {
  it('uses previousValue and newValue for auditable changes', () => {
    expect(makeAuditMetadata({
      previousValue: { status: 'ACTIVE' },
      newValue: { status: 'SUSPENDED' }
    })).toEqual({
      previousValue: { status: 'ACTIVE' },
      newValue: { status: 'SUSPENDED' }
    });
  });

  it('redacts sensitive metadata keys', () => {
    expect(sanitizeAuditMetadata({
      previousValue: null,
      newValue: null,
      password: 'secret',
      nested: {
        apiToken: 'token'
      }
    })).toEqual({
      previousValue: null,
      newValue: null,
      password: '[redacted]',
      nested: {
        apiToken: '[redacted]'
      }
    });
  });
});
