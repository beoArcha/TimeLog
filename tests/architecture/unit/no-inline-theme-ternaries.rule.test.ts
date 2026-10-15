import { describe, it, expect } from 'vitest';
import { NoInlineThemeTernariesRule } from '../rules/no-inline-theme-ternaries.rule';

describe('Unit Tests: NoInlineThemeTernariesRule', () => {
  const rule = new NoInlineThemeTernariesRule();

  it('should detect inline comparisons against theme or resolvedTheme', () => {
    const code = `
import React from 'react';

export function Component({ theme, resolvedTheme }: any) {
  const isLight = resolvedTheme === 'light';
  const isDark = theme !== 'dark';
  return (
    <div className={theme === 'high-contrast' ? 'bg-black' : 'bg-white'}>
      <span>Content</span>
    </div>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/Component.tsx');

    expect(violations.length).toBe(3);
    expect(violations[0].line).toBe(5);
    expect(violations[0].target).toBe("resolvedTheme === 'light'");
    expect(violations[1].line).toBe(6);
    expect(violations[1].target).toBe("theme !== 'dark'");
    expect(violations[2].line).toBe(8);
    expect(violations[2].target).toBe("theme === 'high-contrast'");
  });

  it('should detect property access comparisons like settings.theme or state.resolvedTheme', () => {
    const code = `
export function Check(settings: any) {
  if (settings.theme === 'dark') {
    return 'dark-mode';
  }
  return 'default-mode';
}
`;
    const violations = rule.scanAst(code, 'features/example/Check.ts');

    expect(violations.length).toBe(1);
    expect(violations[0].line).toBe(3);
    expect(violations[0].target).toBe("settings.theme === 'dark'");
  });

  it('should not flag valid CSS token based code without theme comparisons', () => {
    const code = `
import React from 'react';

export function CleanComponent() {
  return (
    <div className="bg-card text-card-foreground border border-border shadow-xs">
      <h1 className="text-foreground">Title</h1>
      <p className="text-muted-foreground">Subtitle</p>
    </div>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/CleanComponent.tsx');

    expect(violations.length).toBe(0);
  });
});
