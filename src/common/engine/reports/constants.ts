import metadata from '@/metadata.json';

export const REPORT_SCHEMA_NAME = 'oxy.report';
export const REPORT_SCHEMA_VERSION = 2;

export const GENERATOR_NAME = 'oxy';
export const GENERATOR_VERSION = metadata.version;

export const ENTITY_PROJECT = 'Project';
export const ENTITY_TASK = 'Task';

export const BASIS_POINTS_FULL = 10_000n;
export const MAX_BASIS_POINTS = 4_294_967_295;

/** Largest integer a JavaScript number represents exactly; money is emitted as a JSON number. */
export const MAX_SAFE_AMOUNT_MINOR = Number.MAX_SAFE_INTEGER;

export const MSG_TASK_HIERARCHY_CYCLE = 'task hierarchy contains a cycle at task';
export const MSG_UNPARSEABLE_RATE = 'effective rate is not a valid amount:';
