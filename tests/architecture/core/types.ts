/**
 * Core interfaces and types for the Architecture Testing Subsystem.
 */

export interface ImportDeclarationInfo {
  /** The raw import/export specifier string (e.g. '@plugins/engine', '../../common') */
  specifier: string;
  /** Normalized path of the file containing the import declaration */
  sourceFile: string;
  /** Resolved normalized path of the imported module, or null if external package */
  resolvedPath: string | null;
  /** Whether the import specifier starts with '.' */
  isRelative: boolean;
  /** Whether this is a type-only import (`import type { ... }`) */
  isTypeOnly: boolean;
  /** Line number in source code where import declaration is located */
  lineNumber: number;
}

export interface DependencyNode {
  /** Normalized path relative to src/ (e.g. 'common/engine/EngineRouter.ts') */
  id: string;
  /** Full absolute path on disk */
  absolutePath: string;
  /** Top-level directory directly under src/ (e.g. 'common', 'features', 'plugins') */
  topLevelDir: string;
  /** All import and export-from declarations extracted from this module */
  imports: ImportDeclarationInfo[];
}

export interface ModuleGraph {
  /** Map of module ID to node details */
  nodes: Map<string, DependencyNode>;
  /** Directed adjacency list: fromModuleId -> set of importedModuleIds */
  adjacencyList: Map<string, Set<string>>;
}

export interface CycleResult {
  /** Ordered list of module IDs forming the cycle (e.g. ['A', 'B', 'A']) */
  path: string[];
  /** Human-readable string representation (e.g. 'A -> B -> A') */
  formatted: string;
}

export interface RuleViolation {
  /** Source file path where the architectural violation occurred */
  file: string;
  /** Identifier of the violated architectural rule */
  rule: string;
  /** Actionable explanation of why this violates architecture and how to fix it */
  message: string;
  /** Optional target module or forbidden dependency */
  target?: string;
  /** Optional line number in source code */
  line?: number;
}

export interface ArchitectureRule<TOptions = unknown> {
  readonly name: string;
  readonly description: string;
  check(graph: ModuleGraph, options?: TOptions): RuleViolation[];
}
