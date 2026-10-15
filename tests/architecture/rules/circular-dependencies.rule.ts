import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';
import { CycleDetector } from '../core/cycle-detector';

/**
 * Architectural Rule: No Circular Dependencies
 * Enforces that no modules within src/ depend on each other cyclically.
 */
export class CircularDependenciesRule implements ArchitectureRule {
  public readonly name = 'no-circular-dependencies';
  public readonly description = 'Ensures zero circular dependency cycles between React components and TS modules.';

  public check(graph: ModuleGraph): RuleViolation[] {
    const cycles = CycleDetector.findCycles(graph.adjacencyList);

    return cycles.map(cycle => ({
      rule: this.name,
      file: cycle.path[0],
      message: `Circular dependency detected: ${cycle.formatted}`,
      target: cycle.path[1],
    }));
  }
}
