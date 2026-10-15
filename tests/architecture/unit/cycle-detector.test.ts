import { describe, it, expect } from 'vitest';
import { CycleDetector } from '../core/cycle-detector';

describe('CycleDetector (Unit Tests)', () => {
  it('should return empty array for an empty graph', () => {
    const graph = new Map<string, string[]>();
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toEqual([]);
  });

  it('should return empty array for an acyclic graph (linear chain A -> B -> C)', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['C']],
      ['C', []],
    ]);
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toHaveLength(0);
  });

  it('should return empty array for a diamond DAG (A -> B -> D, A -> C -> D)', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B', 'C']],
      ['B', ['D']],
      ['C', ['D']],
      ['D', []],
    ]);
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toHaveLength(0);
  });

  it('should detect a direct 2-node cycle (A -> B -> A)', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['A']],
    ]);
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].formatted).toBe('A -> B -> A');
    expect(cycles[0].path).toEqual(['A', 'B', 'A']);
  });

  it('should detect a 3-node cycle (A -> B -> C -> A)', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ]);
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].formatted).toBe('A -> B -> C -> A');
    expect(cycles[0].path).toEqual(['A', 'B', 'C', 'A']);
  });

  it('should detect a self-loop (A -> A)', () => {
    const graph = new Map<string, string[]>([
      ['A', ['A']],
    ]);
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].formatted).toBe('A -> A');
  });

  it('should detect multiple independent cycles in disconnected subgraphs', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['A']],
      ['X', ['Y']],
      ['Y', ['Z']],
      ['Z', ['X']],
      ['Isolated', []],
    ]);
    const cycles = CycleDetector.findCycles(graph);
    expect(cycles).toHaveLength(2);
    const formattedList = cycles.map(c => c.formatted);
    expect(formattedList).toContain('A -> B -> A');
    expect(formattedList).toContain('X -> Y -> Z -> X');
  });

  describe('canonicalizeCycle', () => {
    it('should rotate cycle to start with lexicographically smallest node', () => {
      expect(CycleDetector.canonicalizeCycle(['C', 'A', 'B'])).toEqual(['A', 'B', 'C']);
      expect(CycleDetector.canonicalizeCycle(['Z', 'Y', 'X'])).toEqual(['X', 'Z', 'Y']);
      expect(CycleDetector.canonicalizeCycle(['Single'])).toEqual(['Single']);
    });
  });
});
