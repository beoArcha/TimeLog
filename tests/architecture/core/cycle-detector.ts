import { CycleResult } from './types';

/**
 * Pure, generic cycle detector for directed graphs using depth-first search (DFS)
 * with 3-color marking (White/Gray/Black).
 *
 * Adheres to SRP: Performs graph cycle analysis independently of filesystem or AST.
 */
export class CycleDetector {
  /**
   * Detects all distinct simple cycles in a directed adjacency graph.
   *
   * @param adjacencyMap Map of node ID to an iterable of neighbor node IDs.
   * @returns Array of unique cycles found.
   */
  public static findCycles(adjacencyMap: Map<string, Iterable<string>>): CycleResult[] {
    const visited = new Map<string, number>(); // 0: White (unvisited), 1: Gray (in stack), 2: Black (finished)
    const currentStack: string[] = [];
    const discoveredCycles: CycleResult[] = [];
    const cycleSignatures = new Set<string>();

    const dfs = (node: string) => {
      visited.set(node, 1); // Mark Gray
      currentStack.push(node);

      const neighbors = adjacencyMap.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          const state = visited.get(neighbor) ?? 0;
          if (state === 0) {
            // Unvisited -> continue DFS
            dfs(neighbor);
          } else if (state === 1) {
            // Back-edge detected -> cycle!
            const cycleStartIndex = currentStack.indexOf(neighbor);
            if (cycleStartIndex !== -1) {
              const rawCycle = currentStack.slice(cycleStartIndex);
              const canonical = CycleDetector.canonicalizeCycle(rawCycle);
              const signature = canonical.join(' -> ');

              if (!cycleSignatures.has(signature)) {
                cycleSignatures.add(signature);
                discoveredCycles.push({
                  path: [...canonical, canonical[0]],
                  formatted: `${signature} -> ${canonical[0]}`,
                });
              }
            }
          }
        }
      }

      currentStack.pop();
      visited.set(node, 2); // Mark Black
    };

    for (const node of adjacencyMap.keys()) {
      if ((visited.get(node) ?? 0) === 0) {
        dfs(node);
      }
    }

    return discoveredCycles;
  }

  /**
   * Canonicalizes a cycle by finding the lexicographically smallest element
   * and rotating the cycle so it starts at that element.
   * This ensures rotated instances (e.g. A->B->A and B->A->B) have identical signatures.
   */
  public static canonicalizeCycle(cycle: string[]): string[] {
    if (cycle.length <= 1) {
      return [...cycle];
    }

    let minIndex = 0;
    for (let i = 1; i < cycle.length; i++) {
      if (cycle[i].localeCompare(cycle[minIndex]) < 0) {
        minIndex = i;
      }
    }

    return [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
  }
}
