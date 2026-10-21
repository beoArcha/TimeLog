import { describe, it, expect } from 'vitest';
import { MaxNestedIfsRule } from '../rules/max-nested-ifs.rule';

describe('Unit Tests: MaxNestedIfsRule', () => {
  const rule = new MaxNestedIfsRule();

  it('should allow single depth if statements', () => {
    // Arrange
    const code = `
export function calculate(val: number): number {
  if (val > 0) {
    return val * 2;
  }
  return 0;
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/calculate.ts');

    // Assert
    expect(violations.length).toBe(0);
  });

  it('should allow two levels of nested if statements', () => {
    // Arrange
    const code = `
export function process(a: boolean, b: boolean): string {
  if (a) {
    if (b) {
      return 'both';
    }
    return 'only-a';
  }
  return 'none';
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/process.ts');

    // Assert
    expect(violations.length).toBe(0);
  });

  it('should allow chained else if statements without incrementing nesting depth', () => {
    // Arrange
    const code = `
export function categorize(val: number): string {
  if (val === 1) {
    return 'one';
  } else if (val === 2) {
    return 'two';
  } else if (val === 3) {
    return 'three';
  } else if (val === 4) {
    return 'four';
  } else {
    return 'other';
  }
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/categorize.ts');

    // Assert
    expect(violations.length).toBe(0);
  });

  it('should detect violation when an if statement is nested three levels deep', () => {
    // Arrange
    const code = `
export function deeplyNested(a: boolean, b: boolean, c: boolean): void {
  if (a) {
    if (b) {
      if (c) {
        console.log('too deep!');
      }
    }
  }
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/deeplyNested.ts');

    // Assert
    expect(violations.length).toBe(1);
    expect(violations[0].rule).toBe('max-nested-ifs');
    expect(violations[0].line).toBe(5);
    expect(violations[0].message).toContain('reaches depth 3');
  });

  it('should detect multiple violations when nesting reaches four levels', () => {
    // Arrange
    const code = `
export function levelFour(a: boolean, b: boolean, c: boolean, d: boolean): void {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          console.log('extreme nesting');
        }
      }
    }
  }
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/levelFour.ts');

    // Assert
    expect(violations.length).toBe(2);
    expect(violations[0].line).toBe(5);
    expect(violations[1].line).toBe(6);
  });

  it('should track nesting through loops inside if statements', () => {
    // Arrange
    const code = `
export function loopNesting(items: number[]): void {
  if (items.length > 0) {
    for (const item of items) {
      if (item > 10) {
        if (item % 2 === 0) {
          console.log('nested in loop');
        }
      }
    }
  }
}
`;

    // Act
    const violations = rule.scanAst(code, 'common/loopNesting.ts');

    // Assert
    expect(violations.length).toBe(1);
    expect(violations[0].line).toBe(6);
  });
});
