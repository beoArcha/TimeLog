import fs from 'fs';
import ts from 'typescript';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

export interface TestGovernanceOptions {
  allowlist?: Set<string> | string[];
}

export const TEST_GOVERNANCE_ALLOWLIST = new Set<string>([]);

/**
 * Strategy interface for detecting specific AST anti-patterns in test files.
 */
export interface ITestAstDetector {
  readonly id: string;
  readonly description: string;
  detect(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): RuleViolation | null;
}

/**
 * Detector: Enforces descriptive camelCase or sentence test names instead of identifier snake_case.
 */
export class SnakeCaseTestTitleDetector implements ITestAstDetector {
  public readonly id = 'snake-case-test-title';
  public readonly description = 'Forbids snake_case test titles without spaces (e.g. should_do_something).';

  public detect(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): RuleViolation | null {
    if (!ts.isCallExpression(node)) {
      return null;
    }

    const expression = node.expression;
    const isTestCall =
      (ts.isIdentifier(expression) && (expression.text === 'it' || expression.text === 'test')) ||
      (ts.isPropertyAccessExpression(expression) &&
        ts.isIdentifier(expression.expression) &&
        (expression.expression.text === 'test' || expression.expression.text === 'it'));

    if (!isTestCall || node.arguments.length === 0) {
      return null;
    }

    const firstArg = node.arguments[0];
    if (!ts.isStringLiteral(firstArg) && !ts.isNoSubstitutionTemplateLiteral(firstArg)) {
      return null;
    }

    const testTitle = firstArg.text;
    const isSnakeCase = !testTitle.includes(' ') && testTitle.includes('_');

    if (!isSnakeCase) {
      return null;
    }

    const { line } = sourceFile.getLineAndCharacterOfPosition(firstArg.getStart(sourceFile));
    return {
      rule: 'test-governance',
      file: filePath,
      line: line + 1,
      message: `Forbidden snake_case test name "${testTitle}" on line ${line + 1}. Use descriptive sentence or camelCase format.`,
      target: testTitle,
    };
  }
}

/**
 * Detector: Enforces Testing Library semantic queries instead of raw document.getElementById.
 */
export class RawDomQueryDetector implements ITestAstDetector {
  public readonly id = 'raw-dom-query';
  public readonly description = 'Forbids raw document.getElementById access in test files.';

  public detect(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): RuleViolation | null {
    if (!ts.isCallExpression(node)) {
      return null;
    }

    const expression = node.expression;
    if (
      ts.isPropertyAccessExpression(expression) &&
      expression.name.text === 'getElementById' &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'document'
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      return {
        rule: 'test-governance',
        file: filePath,
        line: line + 1,
        message: `Forbidden raw document.getElementById access on line ${line + 1}. Use semantic queries (getByRole, getByTestId).`,
        target: 'document.getElementById',
      };
    }

    return null;
  }
}

/**
 * Stateless scanner responsible for parsing AST and traversing nodes with registered detectors.
 */
export class TestAstScanner {
  constructor(private readonly detectors: readonly ITestAstDetector[]) {}

  public scan(sourceText: string, filePath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const visit = (node: ts.Node) => {
      for (const detector of this.detectors) {
        const violation = detector.detect(node, sourceFile, filePath);
        if (violation) {
          violations.push(violation);
        }
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return violations;
  }
}

export const DEFAULT_TEST_GOVERNANCE_DETECTORS: readonly ITestAstDetector[] = [
  new SnakeCaseTestTitleDetector(),
  new RawDomQueryDetector(),
];

/**
 * Architectural Rule: Enforces test naming standards and forbids raw DOM element queries in tests.
 */
export class TestGovernanceRule implements ArchitectureRule<TestGovernanceOptions> {
  public readonly name = 'test-governance';
  public readonly description = 'Enforces test governance invariants across test suites via AST analysis.';

  private readonly scanner: TestAstScanner;

  constructor(detectors: readonly ITestAstDetector[] = DEFAULT_TEST_GOVERNANCE_DETECTORS) {
    this.scanner = new TestAstScanner(detectors);
  }

  public check(graph: ModuleGraph, options?: TestGovernanceOptions): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const allowlistSet = options?.allowlist
      ? new Set(Array.isArray(options.allowlist) ? options.allowlist : Array.from(options.allowlist))
      : new Set<string>();

    for (const [nodeId, node] of graph.nodes) {
      const normalizedPath = (node.absolutePath || nodeId).replace(/\\/g, '/');

      if (!this.isTestTargetFile(normalizedPath)) {
        continue;
      }

      const relativeToWorkspace = normalizedPath.includes('tests/')
        ? normalizedPath.substring(normalizedPath.indexOf('tests/'))
        : normalizedPath;

      if (allowlistSet.has(relativeToWorkspace)) {
        continue;
      }

      const fileContent = fs.readFileSync(node.absolutePath, 'utf-8');
      const fileViolations = this.scanner.scan(fileContent, relativeToWorkspace);
      violations.push(...fileViolations);
    }

    return violations;
  }

  public scanAst(sourceText: string, filePath: string): RuleViolation[] {
    return this.scanner.scan(sourceText, filePath);
  }

  private isTestTargetFile(normalizedPath: string): boolean {
    if (!normalizedPath.includes('/tests/')) {
      return false;
    }

    if (
      normalizedPath.includes('/tests/architecture/rules/') ||
      normalizedPath.includes('/tests/architecture/specs/test-governance')
    ) {
      return false;
    }

    return (
      normalizedPath.endsWith('.test.ts') ||
      normalizedPath.endsWith('.test.tsx') ||
      normalizedPath.endsWith('.spec.ts') ||
      normalizedPath.endsWith('.spec.tsx')
    );
  }
}
