import bcrypt from 'bcryptjs';
import { demoTradingData } from './demo-data';
import type { TradingData } from './types';

export const eliteTestAccounts = [
  {
    id: 'elite-test-user-1',
    name: 'Elite Test Trader 1',
    email: 'elite1@tradeharbor.app',
    passwordHash: '$2a$10$scsSR3sWLW1bgInQnTv6D.j.yHdbrCc2ZZOo/jRAiB5rOf.ovV1xq'
  },
  {
    id: 'elite-test-user-2',
    name: 'Elite Test Trader 2',
    email: 'elite2@tradeharbor.app',
    passwordHash: '$2a$10$dpVOkeQ6YIZn0IzGhMvGYuO6WuUD5TITlkyY9Ao3xhYcdsecs3rWi'
  },
  {
    id: 'elite-test-user-3',
    name: 'Elite Test Trader 3',
    email: 'elite3@tradeharbor.app',
    passwordHash: '$2a$10$dU4m8T4zwGAvvx0b3WfwyujtWpXz5Bf4m9.kGbnBHyFMZ/bmVh1lu'
  },
  {
    id: 'elite-test-user-4',
    name: 'Elite Test Trader 4',
    email: 'elite4@tradeharbor.app',
    passwordHash: '$2a$10$6UFLQ.uVUHWJhSd1dP5vQuGSG9dqRfEF1PSvenCTwEcHgqaPAb8zu'
  },
  {
    id: 'elite-test-user-5',
    name: 'Elite Test Trader 5',
    email: 'elite5@tradeharbor.app',
    passwordHash: '$2a$10$ouEJwhZNmd64HNzfLo73Eu3S8MBlVanKnwHLheapJqz6MzaovQcQm'
  }
] as const;

export type EliteTestEmail = (typeof eliteTestAccounts)[number]['email'];

export function findEliteTestAccount(email: string | null | undefined) {
  return eliteTestAccounts.find((account) => account.email === email);
}

export async function validateEliteTestAccount(email: string, password: string) {
  const account = findEliteTestAccount(email);
  if (!account) return null;

  const valid = await bcrypt.compare(password, account.passwordHash);
  return valid ? account : null;
}

export function makeEliteTestTradingData(email: EliteTestEmail): TradingData {
  const account = findEliteTestAccount(email);

  return {
    ...demoTradingData,
    user: {
      ...demoTradingData.user,
      name: account?.name ?? 'Elite Test Trader',
      email,
      plan: 'ELITE'
    },
    account: {
      ...demoTradingData.account,
      name: account ? `${account.name} account` : 'Elite test account'
    },
    isDemoFallback: true
  };
}
