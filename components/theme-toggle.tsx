'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button aria-label={t('common.theme')} variant="ghost" size="icon">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <Button
      aria-label={t('common.theme')}
      title={`${t('common.theme')}: ${theme}`}
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
