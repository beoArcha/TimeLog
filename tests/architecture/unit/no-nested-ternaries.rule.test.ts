import { describe, it, expect } from 'vitest';
import { NoNestedTernariesRule } from '../rules/no-nested-ternaries.rule';

describe('Unit Tests: NoNestedTernariesRule', () => {
  const rule = new NoNestedTernariesRule();

  it('should allow simple single ternary expression', () => {
    // Arrange
    const code = `
export function formatStatus(active: boolean): string {
  return active ? 'ACTIVE' : 'IDLE';
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/formatStatus.ts');

    // Assert
    expect(violations.length).toBe(0);
  });

  it('should allow two levels of nullish coalescing fallbacks', () => {
    // Arrange
    const code = `
export function resolveConfig(primary?: string, secondary?: string): string {
  return primary ?? secondary ?? 'default';
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/resolveConfig.ts');

    // Assert
    expect(violations.length).toBe(0);
  });

  it('should flag ternary nested in true branch', () => {
    // Arrange
    const code = `
export function evaluate(a: boolean, b: boolean): string {
  return a ? (b ? 'both' : 'a-only') : 'none';
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/evaluate.ts');

    // Assert
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain('true branch');
    expect(violations[0].line).toBe(3);
  });

  it('should flag ternary nested in false branch', () => {
    // Arrange
    const code = `
export function getScore(points: number): string {
  return points > 90 ? 'A' : points > 80 ? 'B' : 'C';
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/getScore.ts');

    // Assert
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain('false branch');
    expect(violations[0].line).toBe(3);
  });

  it('should flag ternary nested in condition branch', () => {
    // Arrange
    const code = `
export function check(x: boolean, y: boolean, z: boolean): number {
  return (x ? y : z) ? 1 : 2;
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/check.ts');

    // Assert
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain('condition branch');
    expect(violations[0].line).toBe(3);
  });

  it('should flag nullish coalescing nested deeper than 2 levels', () => {
    // Arrange
    const code = `
export function getFallback(a?: string, b?: string, c?: string, d?: string): string {
  return a ?? b ?? c ?? d ?? 'final';
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/getFallback.ts');

    // Assert
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('Nullish coalescing operator');
  });
});
