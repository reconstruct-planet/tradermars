import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const appAuthSource = readFileSync('lib/app-auth.ts', 'utf8');

describe('app auth guard', () => {
  it('checks the session before allowing database-free demo rendering', () => {
    const sessionCheckIndex = appAuthSource.indexOf('const session = await getServerSession');
    const demoBypassIndex = appAuthSource.indexOf('if (!process.env.DATABASE_URL) return;');

    expect(sessionCheckIndex).toBeGreaterThan(-1);
    expect(demoBypassIndex).toBeGreaterThan(-1);
    expect(sessionCheckIndex).toBeLessThan(demoBypassIndex);
  });

  it('redirects localized protected routes back to their localized login page', () => {
    expect(appAuthSource).toContain('isLocale(firstSegment)');
    expect(appAuthSource).toContain("`/${firstSegment}/login`");
    expect(appAuthSource).toContain('callbackUrl=');
  });
});
