import fs from 'fs';
import ts from 'typescript';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

export interface NoRawHtmlPrimitivesOptions {
  allowlist?: Set<string> | string[];
  maxViolations?: number;
}

const FORBIDDEN_HTML_TAGS: Record<string, string> = {
  button: 'Use <Button> from @components/ui/button',
  input: 'Use <Input> from @components/ui/input or <SearchInput> from @components',
  select: 'Use <Select> from @components/ui/select or <SegmentedControl> from @components',
  textarea: 'Use <Textarea> from @components/ui/textarea',
  label: 'Use <Label> from @components/ui/label',
  table: 'Use <Table> from @components/ui/table or <DataTable> from @components',
  thead: 'Use <TableHeader> from @components/ui/table',
  tbody: 'Use <TableBody> from @components/ui/table',
  tr: 'Use <TableRow> from @components/ui/table',
  th: 'Use <TableHead> from @components/ui/table',
  td: 'Use <TableCell> from @components/ui/table',
  p: 'Use <Text> or <Caption> from @components/ui/typography',
};

export const LEGACY_RAW_HTML_ALLOWLIST = new Set<string>();

/**
 * Architectural Rule: Forbids raw HTML primitives in favor of Design System components.
 */
export class NoRawHtmlPrimitivesRule implements ArchitectureRule<NoRawHtmlPrimitivesOptions> {
  public readonly name = 'no-raw-html-primitives';
  public readonly description = 'Forbids direct usage of raw HTML primitive elements outside src/components/ui/.';

  public check(graph: ModuleGraph, options?: NoRawHtmlPrimitivesOptions): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const allowlistSet = options?.allowlist
      ? new Set(Array.isArray(options.allowlist) ? options.allowlist : Array.from(options.allowlist))
      : new Set<string>();

    for (const [nodeId, node] of graph.nodes) {
      // Exclude files in components/ui/ and test files
      const normalizedId = nodeId.replace(/\\/g, '/');
      if (
        normalizedId.startsWith('components/ui/') ||
        normalizedId.endsWith('.test.tsx') ||
        normalizedId.endsWith('.spec.tsx') ||
        !normalizedId.endsWith('.tsx')
      ) {
        continue;
      }

      // Check allowlist
      if (allowlistSet.has(normalizedId)) {
        continue;
      }

      const fileContent = fs.readFileSync(node.absolutePath, 'utf-8');
      const fileViolations = this.scanAst(fileContent, normalizedId);
      violations.push(...fileViolations);
    }

    return violations;
  }

  /**
   * Scans a TSX source string for forbidden raw JSX elements using TypeScript Compiler AST.
   */
  public scanAst(sourceText: string, filePath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        if (ts.isIdentifier(node.tagName)) {
          const tagName = node.tagName.text;
          const replacement = FORBIDDEN_HTML_TAGS[tagName];

          if (replacement) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            violations.push({
              rule: this.name,
              file: filePath,
              line: line + 1,
              message: `Forbidden raw HTML <${tagName}> tag on line ${line + 1}. ${replacement}.`,
              target: tagName,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return violations;
  }
}
