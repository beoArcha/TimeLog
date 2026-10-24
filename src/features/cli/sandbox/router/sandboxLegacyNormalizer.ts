/**
 * Maps legacy shorthand and flat commands to canonical noun-verb command structure.
 */
export function normalizeLegacyCommand(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;

  const cmd = tokens[0].toLowerCase();
  const rest = tokens.slice(1);

  if (cmd === 'addproject') {
    return ['project', 'add', ...rest];
  }
  if (cmd === 'renameproject') {
    return ['project', 'rename', ...rest];
  }
  if (cmd === 'addtask') {
    const pId = rest[0];
    const name = rest[1];
    if (pId && name) {
      return ['task', 'add', name, '-p', pId];
    }
    return ['task', 'add', ...rest];
  }
  if (cmd === 'addsubtask') {
    const parent = rest[0];
    const name = rest[1];
    if (parent && name) {
      return ['task', 'add', name, '-P', parent];
    }
    return ['task', 'add', ...rest];
  }
  if (cmd === 'complete') {
    return ['task', 'done', ...rest];
  }
  if (cmd === 'renametask') {
    return ['task', 'rename', ...rest];
  }
  if (cmd === 'tasks') {
    if (rest[0]) {
      return ['task', 'list', '-p', rest[0]];
    }
    return ['task', 'list'];
  }
  if (cmd === 'projects' || cmd === 'projlist') {
    return ['project', 'list', ...rest];
  }

  return tokens;
}
