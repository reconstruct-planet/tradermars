import type enMessages from '@/messages/en.json';

export type Dictionary = typeof enMessages;
export type MessageNamespace = keyof Dictionary;
export type Messages = Partial<Pick<Dictionary, MessageNamespace>>;

export function getMessage(messages: Messages, key: string, values?: Record<string, string | number>) {
  const message = getNestedValue(messages, key) ?? key;
  if (typeof message !== 'string') return message as string;
  if (!values) return message;

  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    message
  );
}

function getNestedValue(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}
