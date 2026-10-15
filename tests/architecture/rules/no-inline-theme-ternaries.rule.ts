import fs from 'fs';
import ts from 'typescript';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

export interface NoInlineThemeTernariesOptions {
  allowlist?: Set<string> | string[];
}

/**
 * Migration allowlist of views scheduled for refactoring in Phases 2-5.
 * Strictly reduced to empty in Phase 6.
 */
export const THEME_TERNARY_ALLOWLIST = new Set<string>([
  'features/settings/ManualTab.tsx',
  'layouts/parts/Sidebar.tsx',
  'features/tasks/components/ProjectHeaderCard.tsx',
  'features/cli/CliInterface.tsx',
  'features/settings/BackupTab.tsx',
  'features/db-explorer/components/DbInspector.tsx',
  'features/holidays/HolidaysLeavesView.tsx',
  'features/tray/TrayWidgetView.tsx',
  'features/settings/SettingsTab.tsx',
  'layouts/parts/ActiveTimerBanner.tsx',
  'features/reports/components/ReportStatsCards.tsx',
  'features/tasks/TaskListView.tsx',
  'layouts/parts/MediumProjectSelector.tsx',
  'layouts/components/header-parts/ThemeSelector.tsx',
  'features/db-explorer/components/PatchLogsTable.tsx',
  'layouts/manager/LayoutManager.tsx',
  'layouts/components/BackgroundGradients.tsx',
  'layouts/components/header-parts/LanguageSelector.tsx',
  'features/reports/components/ReportLogList.tsx',
  'layouts/components/header-parts/TextScaleSelector.tsx',
  'layouts/components/header-parts/LayoutSelector.tsx',
  'features/tasks/components/TaskItem/TaskMetrics.tsx',
  'layouts/components/TabBar.tsx',
  'features/tasks/components/TaskItem/SubtaskItem.tsx',
  'layouts/components/DaemonStatusBar.tsx',
  'features/reports/ReportView.tsx',
  'layouts/parts/MediumHeaderActions.tsx',
  'layouts/components/header-parts/AppLogo.tsx',
  'layouts/parts/MediumTabBar.tsx',
  'layouts/compact/CompactLayout.tsx',
  'features/tasks/components/TaskItem/SubtaskForm.tsx',
  'features/db-explorer/components/ProjectsTable.tsx',
  'features/reports/components/ReportPeriodSelector.tsx',
  'features/db-explorer/components/TasksTable.tsx',
  'features/db-explorer/components/TimeLogsTable.tsx',
  'features/tasks/components/TaskItem/TaskItem.tsx',
  'features/db-explorer/components/HolidaysLeavesTable.tsx',
  'features/settings/CreditsTab.tsx',
  'layouts/builders/FullLayoutBuilder.tsx',
  'layouts/compact/ActiveProjectCard.tsx',
  'layouts/compact/TaskVisibilityToggle.tsx',
  'layouts/compact/TaskCard.tsx',
  'features/tasks/components/TaskItem/TaskNameEditor.tsx',
  'features/tasks/components/TaskEmptyState.tsx',
  'layouts/components/header-parts/StatusIndicator.tsx',
  'features/tasks/components/TaskItem/SubtaskList.tsx',
  'layouts/components/Header.tsx',
  'features/tasks/components/TaskItem/TaskHeader.tsx',
]);

/**
 * Architectural Rule: Forbids inline theme checks in favor of CSS variables and Design Tokens.
 */
export class NoInlineThemeTernariesRule implements ArchitectureRule<NoInlineThemeTernariesOptions> {
  public readonly name = 'no-inline-theme-ternaries';
  public readonly description = 'Forbids inline theme comparisons outside src/styles/ and useAppSettings.tsx.';

  public check(graph: ModuleGraph, options?: NoInlineThemeTernariesOptions): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const allowlistSet = options?.allowlist
      ? new Set(Array.isArray(options.allowlist) ? options.allowlist : Array.from(options.allowlist))
      : new Set<string>();

    for (const [nodeId, node] of graph.nodes) {
      const normalizedId = nodeId.replace(/\\/g, '/');

      // Exclude styles subsystem, settings resolution hook, and tests
      if (
        normalizedId.startsWith('styles/') ||
        normalizedId.includes('useAppSettings.tsx') ||
        normalizedId.includes('.test.') ||
        normalizedId.includes('.spec.')
      ) {
        continue;
      }

      if (allowlistSet.has(normalizedId)) {
        continue;
      }

      const fileContent = fs.readFileSync(node.absolutePath, 'utf-8');
      const fileViolations = this.scanAst(fileContent, normalizedId);
      violations.push(...fileViolations);
    }

    return violations;
  }

  public scanAst(sourceText: string, filePath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const isThemeIdentifier = (expr: ts.Expression): boolean => {
      if (ts.isIdentifier(expr)) {
        return expr.text === 'theme' || expr.text === 'resolvedTheme';
      }
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'theme' || expr.name.text === 'resolvedTheme';
      }
      return false;
    };

    const isThemeComparison = (node: ts.BinaryExpression): boolean => {
      const op = node.operatorToken.kind;
      const isEqualityOp =
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken;

      if (!isEqualityOp) return false;

      return isThemeIdentifier(node.left) || isThemeIdentifier(node.right);
    };

    const visit = (node: ts.Node) => {
      if (ts.isBinaryExpression(node) && isThemeComparison(node)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({
          rule: this.name,
          file: filePath,
          line: line + 1,
          message: `Forbidden inline theme check '${node.getText(sourceFile)}' on line ${line + 1}. Rely on CSS design tokens or DIP contracts.`,
          target: node.getText(sourceFile),
        });
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return violations;
  }
}
