import { SandboxEmulatorStore } from '../../sandboxEmulatorStore';
import { TerminalOutput } from '../../../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { resolveEntity } from '../../../resolver/entityResolver';

export function handleProjectList(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const showAll = Boolean(flags['a'] || flags['all']);
  const allProjects = store.getProjects();
  const projects = showAll ? allProjects : allProjects.filter((p) => !p.archived);

  if (projects.length === 0) {
    output.info('No projects found in sandbox.');
    return;
  }

  const metrics = store.getComputedMetrics();
  output.info('┌──────┬────────────────────────────────┬────────────────────────┐');
  output.info('│ ID   │ Name                           │ Total Time             │');
  output.info('├──────┼────────────────────────────────┼────────────────────────┤');
  for (const p of projects) {
    const totalSecs = metrics?.projects[p.id]?.totalElapsedSeconds ?? 0;
    const timeStr = formatSeconds(totalSecs);
    const idCol = p.id.padEnd(4);
    const nameCol = p.name.slice(0, 30).padEnd(30);
    const timeCol = timeStr.padEnd(22);
    const archivedMark = p.archived ? ' [archived]' : '';
    output.output(`│ ${idCol} │ ${nameCol} │ ${timeCol} │${archivedMark}`);
  }
  output.info('└──────┴────────────────────────────────┴──────────────────────┴──────────┘');
}

export function handleProjectAdd(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const name = positionals[0];
  if (!name) {
    output.error('Error: Project name is required. Usage: project add <name> [-c <color>] [--rate <rate>] [--currency <curr>]', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }
  const color = (flags['c'] || flags['color'] || 'indigo') as string;
  const rate = flags['rate'] ? String(flags['rate']) : undefined;
  const currency = flags['currency'] ? String(flags['currency']) : undefined;
  const project = store.handleAddProject(name, color, rate, currency);
  output.success(`Project created: "${project.name}" [ID: ${project.id}] (color: ${project.color})`);
}

export function handleProjectRename(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  const newName = positionals[1];
  const color = (flags['c'] || flags['color']) as string | undefined;
  const rateFlag = flags['rate'] ? String(flags['rate']) : undefined;
  const currencyFlag = flags['currency'] ? String(flags['currency']) : undefined;

  if (!target) {
    output.error('Error: Project target is required. Usage: project rename <target> [new_name] [-c <color>] [--rate <rate>] [--currency <curr>]', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const projects = store.getProjects();
  const resolve = resolveEntity(projects, target, 'Project', (p) => p.id, (p) => p.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Project "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const project = resolve.entity;
  const finalName = newName || project.name;

  let finalRate: string | null | undefined;
  if (rateFlag !== undefined) {
    const lower = rateFlag.toLowerCase();
    if (lower === 'none' || lower === 'clear') {
      finalRate = null;
    } else {
      finalRate = rateFlag;
    }
  }

  let finalCurrency: string | null | undefined;
  if (currencyFlag !== undefined) {
    const lower = currencyFlag.toLowerCase();
    if (lower === 'none' || lower === 'clear') {
      finalCurrency = null;
    } else {
      finalCurrency = currencyFlag;
    }
  }

  store.handleRenameProject(project.id, finalName, color, finalRate, finalCurrency);
  output.success(`Project updated: "${finalName}" [ID: ${project.id}]`);
}

export function handleProjectArchive(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  if (!target) {
    output.error('Error: Project target is required. Usage: project archive <target>', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const projects = store.getProjects();
  const resolve = resolveEntity(projects, target, 'Project', (p) => p.id, (p) => p.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Project "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const project = resolve.entity;
  store.handleArchiveProject(project.id);
  const status = project.archived ? 'unarchived' : 'archived';
  output.success(`Project "${project.name}" [ID: ${project.id}] has been ${status}.`);
}
