import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(root, 'messages');
const configPath = path.join(root, 'lib', 'i18n-config.ts');
const strictUnused = process.argv.includes('--strict-unused');

const errors = [];
const warnings = [];

const supportedLocales = readLocalesFromConfig();
const defaultLocale = readDefaultLocaleFromConfig();

if (!supportedLocales.includes(defaultLocale)) {
  errors.push(`defaultLocale "${defaultLocale}" is not listed in localeConfig.`);
}

for (const locale of supportedLocales) {
  try {
    Intl.getCanonicalLocales(locale);
  } catch {
    errors.push(`"${locale}" is not a valid BCP 47 language code.`);
  }
}

const messageFiles = readdirSync(messagesDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();

for (const locale of supportedLocales) {
  if (!messageFiles.includes(locale)) {
    errors.push(`Missing messages/${locale}.json for configured locale "${locale}".`);
  }
}

for (const fileLocale of messageFiles) {
  if (!supportedLocales.includes(fileLocale)) {
    errors.push(`messages/${fileLocale}.json exists but "${fileLocale}" is not in localeConfig.`);
  }
}

const dictionaries = Object.fromEntries(
  supportedLocales
    .filter((locale) => messageFiles.includes(locale))
    .map((locale) => [locale, readJson(path.join(messagesDir, `${locale}.json`))])
);

const baseDictionary = dictionaries[defaultLocale];
if (!baseDictionary) {
  errors.push(`Default messages/${defaultLocale}.json could not be loaded.`);
} else {
  const baseShape = flattenShape(baseDictionary);
  const baseKeys = Object.keys(baseShape).sort();

  for (const locale of supportedLocales) {
    const dictionary = dictionaries[locale];
    if (!dictionary) continue;

    const shape = flattenShape(dictionary);
    const keys = Object.keys(shape).sort();

    for (const key of baseKeys) {
      if (!(key in shape)) {
        errors.push(`${locale}: missing translation key "${key}".`);
        continue;
      }
      if (shape[key].type !== baseShape[key].type) {
        errors.push(`${locale}: key "${key}" has type ${shape[key].type}, expected ${baseShape[key].type}.`);
      }
      if (shape[key].length !== baseShape[key].length) {
        errors.push(`${locale}: key "${key}" has array length ${shape[key].length}, expected ${baseShape[key].length}.`);
      }
      if (shape[key].placeholders.join(',') !== baseShape[key].placeholders.join(',')) {
        errors.push(
          `${locale}: key "${key}" placeholders {${shape[key].placeholders.join(',')}} do not match default {${baseShape[key].placeholders.join(',')}}.`
        );
      }
    }

    for (const key of keys) {
      if (!(key in baseShape)) {
        errors.push(`${locale}: extra translation key "${key}" is not present in ${defaultLocale}.`);
      }
    }
  }

  const usage = scanTranslationUsage();
  for (const key of usage.staticKeys) {
    if (!baseShape[key]) {
      errors.push(`Source uses missing translation key "${key}".`);
    }
  }
  for (const prefix of usage.dynamicPrefixes) {
    if (!baseKeys.some((key) => key.startsWith(prefix))) {
      errors.push(`Source uses dynamic translation prefix "${prefix}" but no default keys match it.`);
    }
  }

  const possiblyUsedPrefixes = [
    'meta.',
    'landing.',
    'pricing.',
    'nav.',
    'insights.suggestedQuestions',
    'features.',
    ...usage.dynamicPrefixes
  ];
  const unused = baseKeys.filter((key) => {
    if (usage.staticKeys.has(key)) return false;
    return !possiblyUsedPrefixes.some((prefix) => key.startsWith(prefix));
  });

  if (unused.length) {
    const message = `Possibly unused translation keys (${unused.length}): ${unused.slice(0, 40).join(', ')}${unused.length > 40 ? ', ...' : ''}`;
    if (strictUnused) errors.push(message);
    else warnings.push(message);
  }
}

if (warnings.length) {
  console.warn(warnings.map((warning) => `warning: ${warning}`).join('\n'));
}

if (errors.length) {
  console.error(errors.map((error) => `error: ${error}`).join('\n'));
  process.exit(1);
}

console.log(`i18n validation passed for ${supportedLocales.join(', ')}.`);

function readLocalesFromConfig() {
  const source = readFileSync(configPath, 'utf8');
  const block = source.match(/export const localeConfig = \{([\s\S]*?)\n\} as const;/)?.[1];
  if (!block) {
    errors.push('Could not read localeConfig from lib/i18n-config.ts.');
    return [];
  }

  return [...block.matchAll(/^\s{2}['"]?([A-Za-z]{2}(?:-[A-Za-z]{2})?)['"]?:\s*\{/gm)].map((match) => match[1]);
}

function readDefaultLocaleFromConfig() {
  const source = readFileSync(configPath, 'utf8');
  const locale = source.match(/export const defaultLocale: Locale = ['"]([^'"]+)['"];/)?.[1];
  if (!locale) {
    errors.push('Could not read defaultLocale from lib/i18n-config.ts.');
    return 'en';
  }
  return locale;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${path.relative(root, filePath)} is not valid JSON: ${error.message}`);
    return {};
  }
}

function flattenShape(value, prefix = '', output = {}) {
  if (Array.isArray(value)) {
    output[prefix] = {
      type: 'array',
      length: value.length,
      placeholders: placeholders(value.join(' '))
    };
    return output;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flattenShape(child, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }

  const type = typeof value;
  output[prefix] = {
    type,
    length: undefined,
    placeholders: type === 'string' ? placeholders(value) : []
  };
  return output;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{([A-Za-z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

function scanTranslationUsage() {
  const roots = ['app', 'components', 'lib'].map((name) => path.join(root, name));
  const files = roots.flatMap((directory) => walk(directory)).concat(path.join(root, 'middleware.ts'));
  const staticKeys = new Set();
  const dynamicPrefixes = new Set();

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
      staticKeys.add(match[1]);
    }
    for (const match of source.matchAll(/\bt\(\s*`([^`$]*)\$\{/g)) {
      if (match[1]) dynamicPrefixes.add(match[1]);
    }
  }

  return { staticKeys, dynamicPrefixes };
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
