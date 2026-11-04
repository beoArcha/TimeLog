import fs from 'fs';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

/**
 * Architectural Rule: Motion Primitive Encapsulation
 * Forbids direct instantiation of raw motion elements (e.g. motion.div, motion.form, motion.span)
 * outside src/components/ composite wrappers.
 */
export class NoRawMotionRule implements ArchitectureRule {
  public readonly name = 'no-raw-motion';
  public readonly description =
    'Forbids direct usage of raw motion primitives (motion.*) outside src/components/ composite components.';

  public scanContent(content: string, filePath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        return;
      }

      if (/<\s*motion\.[a-zA-Z]+|\bmotion\.[a-zA-Z]+\s*\(/.test(lineText)) {
        violations.push({
          rule: this.name,
          file: filePath,
          line: idx + 1,
          message: `Forbidden raw motion primitive on line ${idx + 1} in "${filePath}". Encapsulate animations into composite components in @components (such as AnimatedCard, AnimatedFade, AnimatedCollapse, AnimatedDrawer).`,
        });
      }
    });

    return violations;
  }

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      const normalizedId = nodeId.replace(/\\/g, '/');

      // Allow composite animation components in src/components/ (and exclude test files)
      if (
        (normalizedId.startsWith('components/') && !normalizedId.startsWith('components/ui/')) ||
        normalizedId.includes('.test.') ||
        normalizedId.includes('.spec.') ||
        (!normalizedId.endsWith('.tsx') && !normalizedId.endsWith('.ts'))
      ) {
        continue;
      }

      const fileContent = fs.readFileSync(node.absolutePath, 'utf-8');
      violations.push(...this.scanContent(fileContent, normalizedId));
    }

    return violations;
  }
}
