import { describe, expect, it } from 'vitest';
import {
  eliteTestAccounts,
  makeEliteTestTradingData,
  validateEliteTestAccount
} from '../lib/test-accounts';

const passwords = [
  'Elite-1-lKEiievnsnCp',
  'Elite-2-yGa0jcZGYG42',
  'Elite-3-QARpdfy9kJCQ',
  'Elite-4-Bjink5Pfqhuc',
  'Elite-5-1lWT8Euk49WY'
];

describe('elite test accounts', () => {
  it('validates every configured account with its own password', async () => {
    for (const [index, account] of eliteTestAccounts.entries()) {
      await expect(validateEliteTestAccount(account.email, passwords[index])).resolves.toMatchObject({
        email: account.email,
        name: account.name
      });
    }
  });

  it('rejects mismatched passwords', async () => {
    await expect(validateEliteTestAccount(eliteTestAccounts[0].email, passwords[1])).resolves.toBeNull();
  });

  it('uses elite plan fallback data for test accounts', () => {
    const data = makeEliteTestTradingData(eliteTestAccounts[4].email);

    expect(data.user.email).toBe('elite5@tradeharbor.app');
    expect(data.user.plan).toBe('ELITE');
    expect(data.trades.length).toBeGreaterThan(0);
  });
});
