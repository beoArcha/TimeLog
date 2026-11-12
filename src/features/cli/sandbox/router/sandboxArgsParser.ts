export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

// Presence-only switches never take a value; consuming the next token would turn `task add -q <name>` into a flag value.
const BOOLEAN_FLAGS = new Set([
  'q',
  'quiet',
  'all',
  'a',
  'yes',
  'y',
  'json',
  'j',
  'machine',
  'm',
  'exact',
  'if-running',
  'tree',
  'today',
  'yesterday',
  'week',
  'last-week',
  'month',
  'last-month',
]);

/**
 * Parses command tokens into positional arguments and key-value/boolean flags.
 * Supports --key=value, --key value, --boolean-flag, and short -k value / -k boolean.
 */
export function parseFlags(tokens: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      if (eqIdx !== -1) {
        flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
        continue;
      }
      const key = token.slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
        continue;
      }
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (token.startsWith('-') && token.length > 1) {
      const key = token.slice(1);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
        continue;
      }
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(token);
    }
  }

  return { positionals, flags };
}
