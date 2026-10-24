import { describe, it, expect } from 'vitest';
import { NoRawMotionRule } from '../rules/no-raw-motion.rule';

describe('Unit Tests: NoRawMotionRule', () => {
  const rule = new NoRawMotionRule();

  it('should detect raw motion.div and motion.form in feature code', () => {
    // Arrange
    const code = `
import React from 'react';
import { motion } from 'motion/react';

export function Example() {
  return (
    <motion.div initial={{ opacity: 0 }}>
      <motion.form onSubmit={() => {}}>
        <input />
      </motion.form>
    </motion.div>
  );
}
`;

    // Act
    const violations = rule.scanContent(code, 'features/example/Example.tsx');

    // Assert
    expect(violations.length).toBe(2);
    expect(violations[0].line).toBe(7);
    expect(violations[1].line).toBe(8);
  });

  it('should ignore motion occurrences inside comments', () => {
    // Arrange
    const code = `
// <motion.div initial={{ opacity: 0 }}>
/* <motion.form> */
* <motion.span>
`;

    // Act
    const violations = rule.scanContent(code, 'features/example/Example.tsx');

    // Assert
    expect(violations.length).toBe(0);
  });

  it('should return 0 violations for clean components without raw motion tags', () => {
    // Arrange
    const code = `
import React from 'react';
import { AnimatedCard } from '@components/AnimatedCard';

export function Example() {
  return (
    <AnimatedCard>
      <div>Content</div>
    </AnimatedCard>
  );
}
`;

    // Act
    const violations = rule.scanContent(code, 'features/example/Example.tsx');

    // Assert
    expect(violations.length).toBe(0);
  });
});
