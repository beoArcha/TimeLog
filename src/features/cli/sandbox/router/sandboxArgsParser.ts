export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

// Quiet is a presence-only switch; consuming the next token would turn `task add -q <name>` into a flag value.
const PRESENCE_ONLY_FLAGS = new Set(['q', 'quiet']);

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
      const next = tokens[i + 1];
      if (!PRESENCE_ONLY_FLAGS.has(key) && next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (token.startsWith('-') && token.length > 1) {
      const key = token.slice(1);
      const next = tokens[i + 1];
      if (!PRESENCE_ONLY_FLAGS.has(key) && next && !next.startsWith('-')) {
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
