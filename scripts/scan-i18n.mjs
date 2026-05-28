import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = ['app', 'components', 'lib'].map((name) => path.join(root, name));
const ignoredSegments = [
  `${path.sep}components${path.sep}ui${path.sep}`,
  `${path.sep}messages${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.next${path.sep}`
];

const propNames = [
  'aria-label',
  'alt',
  'placeholder',
  'title'
];

const suspicious = [];

for (const file of sourceRoots.flatMap(walk)) {
  if (ignoredSegments.some((segment) => file.includes(segment))) continue;
  const relative = path.relative(root, file);
  const source = readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes('i18n-scan-ignore')) return;
    if (line.trim().startsWith('//')) return;

    if (file.endsWith('.tsx')) {
      const jsxTextMatches = [...line.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)];
      for (const match of jsxTextMatches) {
        report(relative, index + 1, 'jsx-text', match[1]);
      }
    }

    for (const prop of propNames) {
      const propMatches = [...line.matchAll(new RegExp(`${prop}=["']([^"']*[A-Za-z][^"']*)["']`, 'g'))];
      for (const match of propMatches) {
        report(relative, index + 1, prop, match[1]);
      }
    }

    for (const match of line.matchAll(/\b(?:alert|confirm|setError|throw new Error)\(\s*['"`]([^'"`]*[A-Za-z][^'"`]*)['"`]/g)) {
      report(relative, index + 1, 'message-literal', match[1]);
    }
  });
}

if (!suspicious.length) {
  console.log('No obvious hardcoded user-facing strings found in app, components, or lib.');
} else {
  console.log(`Potential hardcoded user-facing strings (${suspicious.length}):`);
  for (const item of suspicious.slice(0, 250)) {
    console.log(`${item.file}:${item.line} [${item.kind}] ${item.text}`);
  }
  if (suspicious.length > 250) {
    console.log(`...and ${suspicious.length - 250} more. Narrow the scan or translate the highest-signal files first.`);
  }
}

function report(file, line, kind, rawText) {
  const text = normalize(rawText);
  if (!text || isLikelyCode(text)) return;
  suspicious.push({ file, line, kind, text });
}

function normalize(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelyCode(text) {
  if (text.length < 3) return true;
  if (/^[A-Z0-9_./:-]+$/.test(text)) return true;
  if (/^[A-Za-z_]+\/[A-Za-z_]+$/.test(text)) return true;
  if (/^[.#]?[a-z0-9_-]+$/i.test(text) && !text.includes(' ')) return true;
  if (/^(http|\/|@|data-|--)/.test(text)) return true;
  if (/[=<>?:]/.test(text) && /\b(value|props|item|row)\b/.test(text)) return true;
  if (/^[{}[\]().,:;+\-*|]+$/.test(text)) return true;
  if (/^[A-Z]{1,5}$/.test(text)) return true;
  if (/^\$?\d/.test(text)) return true;
  return false;
}

function walk(directory) {
  if (!statSync(directory, { throwIfNoEntry: false })?.isDirectory()) return [];

  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return walk(fullPath);
    if (/\.(ts|tsx)$/.test(entry)) return [fullPath];
    return [];
  });
}
