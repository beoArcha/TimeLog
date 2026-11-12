import type { ReportProject } from '@bindings/ReportProject';
import type { ReportSubtask } from '@bindings/ReportSubtask';
import type { ReportTask } from '@bindings/ReportTask';
import type { Task } from '@bindings/Task';
import type { RateResolver } from './billing';
import type { Catalog } from './catalog';
import type { MeasuredEntry } from './entries';
import { compareIds, compareSecondsDescThenId, shareBasisPoints } from './ordering';
import { definedOnly } from './serialize';
import { Tally } from './tally';

const valueOrZero = (map: ReadonlyMap<string, number>, key: string): number => map.get(key) ?? 0;

function addTo(map: Map<string, number>, key: string, seconds: number): void {
  map.set(key, valueOrZero(map, key) + seconds);
}

/** Direct and cumulative seconds per task, plus project-level time without a task. */
export class Aggregate {
  readonly projectDirect = new Map<string, number>();
  private readonly taskDirect = new Map<string, number>();
  private readonly taskTotal = new Map<string, number>();

  constructor(entries: readonly MeasuredEntry[]) {
    for (const entry of entries) this.add(entry);
  }

  direct(taskId: string): number {
    return valueOrZero(this.taskDirect, taskId);
  }

  total(taskId: string): number {
    return valueOrZero(this.taskTotal, taskId);
  }

  private add(entry: MeasuredEntry): void {
    const [ownTask] = entry.chain;
    if (!ownTask) {
      addTo(this.projectDirect, entry.projectId, entry.seconds);
      return;
    }
    addTo(this.taskDirect, ownTask.id, entry.seconds);
    for (const task of entry.chain) addTo(this.taskTotal, task.id, entry.seconds);
  }
}

interface TreeContext {
  readonly aggregate: Aggregate;
  readonly rates: RateResolver;
  readonly totalSeconds: number;
  /** Only tasks with time in range, siblings already ordered. */
  readonly children: ReadonlyMap<string, readonly Task[]>;
}

/** The projects plus one tally over all of them, so document totals never re-derive rates. */
export interface ProjectsReport {
  readonly projects: ReportProject[];
  readonly tally: Tally;
}

type TasksByKey = Map<string, Task[]>;

export function buildProjects(
  catalog: Catalog,
  aggregate: Aggregate,
  rates: RateResolver,
  totalSeconds: number
): ProjectsReport {
  const { roots, children } = groupTasks(catalog, aggregate);
  const context: TreeContext = { aggregate, rates, totalSeconds, children };

  // Sorted so that, when several projects fail, the same one is reported first as in the Rust engine.
  const projectIds = [...new Set([...aggregate.projectDirect.keys(), ...roots.keys()])].sort(compareIds);

  const projects: ReportProject[] = [];
  const tally = new Tally();
  for (const projectId of projectIds) {
    const built = buildProject(catalog, context, projectId, roots.get(projectId) ?? []);
    tally.merge(built.tally);
    projects.push(built.project);
  }
  projects.sort(compareSecondsDescThenId);
  return { projects, tally };
}

function groupTasks(catalog: Catalog, aggregate: Aggregate): { roots: TasksByKey; children: TasksByKey } {
  const roots: TasksByKey = new Map();
  const children: TasksByKey = new Map();
  for (const task of catalog.allTasks()) {
    if (aggregate.total(task.id) === 0) continue;
    const bucket = task.parentTaskId == null ? roots : children;
    const key = task.parentTaskId ?? task.projectId;
    const siblings = bucket.get(key);
    if (siblings) siblings.push(task);
    else bucket.set(key, [task]);
  }
  for (const siblings of children.values()) sortSiblings(siblings, aggregate);
  return { roots, children };
}

function sortSiblings(siblings: Task[], aggregate: Aggregate): void {
  siblings.sort((a, b) =>
    compareSecondsDescThenId({ id: a.id, seconds: aggregate.total(a.id) }, { id: b.id, seconds: aggregate.total(b.id) })
  );
}

function buildProject(
  catalog: Catalog,
  context: TreeContext,
  projectId: string,
  roots: readonly Task[]
): { project: ReportProject; tally: Tally } {
  const project = catalog.project(projectId);
  const directSeconds = valueOrZero(context.aggregate.projectDirect, projectId);

  const orderedRoots = [...roots];
  sortSiblings(orderedRoots, context.aggregate);
  const tally = new Tally();
  tally.addTaskless(directSeconds);
  const tasks = orderedRoots.map((root) => buildTask(context, root, tally));
  const seconds = directSeconds + tasks.reduce((sum, task) => sum + task.seconds, 0);

  return {
    project: {
      id: project.id,
      name: project.name,
      directSeconds,
      seconds,
      shareBasisPoints: shareBasisPoints(seconds, context.totalSeconds),
      billing: tally.currencyTotals(),
      tasks,
    },
    tally,
  };
}

function buildTask(context: TreeContext, root: Task, tally: Tally): ReportTask {
  const seconds = context.aggregate.total(root.id);
  const directSeconds = context.aggregate.direct(root.id);
  const billing = context.rates.bill(root, directSeconds);
  tally.addTask(billing, directSeconds);
  return {
    id: root.id,
    name: root.name,
    directSeconds,
    seconds,
    shareBasisPoints: shareBasisPoints(seconds, context.totalSeconds),
    ...definedOnly({ rateMinor: billing.rateMinor, currency: billing.currency }),
    rateStatus: billing.rateStatus,
    ...definedOnly({ amountMinor: billing.amountMinor }),
    subtasks: flattenDescendants(context, root.id, tally),
  };
}

interface PendingTask {
  readonly task: Task;
  readonly parentId: string;
}

/** Depth-first pre-order without recursion, so a very deep hierarchy cannot overflow the stack. */
function flattenDescendants(context: TreeContext, rootId: string, tally: Tally): ReportSubtask[] {
  const subtasks: ReportSubtask[] = [];
  const stack = childrenReversed(context, rootId);
  for (let pending = stack.pop(); pending; pending = stack.pop()) {
    const { task, parentId } = pending;
    const directSeconds = context.aggregate.direct(task.id);
    const seconds = context.aggregate.total(task.id);
    const billing = context.rates.bill(task, directSeconds);
    tally.addTask(billing, directSeconds);
    subtasks.push({
      id: task.id,
      name: task.name,
      parentTaskId: parentId,
      directSeconds,
      seconds,
      shareBasisPoints: shareBasisPoints(seconds, context.totalSeconds),
      ...definedOnly({ rateMinor: billing.rateMinor, currency: billing.currency }),
      rateStatus: billing.rateStatus,
      ...definedOnly({ amountMinor: billing.amountMinor }),
    });
    stack.push(...childrenReversed(context, task.id));
  }
  return subtasks;
}

/** Pushing siblings in reverse makes the stack pop the first-ordered sibling first. */
function childrenReversed(context: TreeContext, parentId: string): PendingTask[] {
  const children = context.children.get(parentId) ?? [];
  return children.map((task) => ({ task, parentId })).reverse();
}
