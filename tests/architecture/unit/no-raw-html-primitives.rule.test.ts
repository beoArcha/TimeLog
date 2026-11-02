import { describe, it, expect } from 'vitest';
import { NoRawHtmlPrimitivesRule } from '../rules/no-raw-html-primitives.rule';
import { ModuleGraph } from '../core/types';

describe('Unit Tests: NoRawHtmlPrimitivesRule', () => {
  const rule = new NoRawHtmlPrimitivesRule();

  it('should detect raw HTML elements and report correct line numbers and suggestions', () => {
    const code = `
import React from 'react';

export function Example() {
  return (
    <div>
      <label>Username</label>
      <input type="text" />
      <button type="submit">Submit</button>
      <textarea />
      <select><option>Opt</option></select>
    </div>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/Example.tsx');

    expect(violations.length).toBe(5);

    const tags = violations.map(v => v.target);
    expect(tags).toContain('label');
    expect(tags).toContain('input');
    expect(tags).toContain('button');
    expect(tags).toContain('textarea');
    expect(tags).toContain('select');

    expect(violations[0].line).toBe(7);
    expect(violations[0].message).toContain('Use <Label>');
    expect(violations[1].line).toBe(8);
    expect(violations[1].message).toContain('Use <Input>');
    expect(violations[2].line).toBe(9);
    expect(violations[2].message).toContain('Use <Button>');
  });

  it('should detect raw table elements', () => {
    const code = `
export function TableExample() {
  return (
    <table>
      <thead>
        <tr>
          <th>Header</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cell</td>
        </tr>
      </tbody>
    </table>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/TableExample.tsx');
    expect(violations.length).toBe(7); // table, thead, tr, th, tbody, tr, td
  });

  it('should not flag Design System components or standard HTML non-primitive tags', () => {
    const code = `
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { DataTable } from '@components/DataTable';
import { Area } from '@components/ui/area';

export function CleanComponent() {
  return (
    <div className="container">
      <span className="text">Text</span>
      <Area as="section">
        <Area as="article">Content</Area>
        <Button>Click</Button>
        <Input placeholder="Enter" />
        <DataTable columns={[]} data={[]} />
      </Area>
    </div>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/CleanComponent.tsx');
    expect(violations).toHaveLength(0);
  });

  it('should flag raw <p> tags and suggest typography components', () => {
    const code = `
export function ParagraphComponent() {
  return (
    <div>
      <p>Raw text</p>
    </div>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/ParagraphComponent.tsx');
    expect(violations).toHaveLength(1);
    expect(violations[0].target).toBe('p');
    expect(violations[0].message).toContain('Use <Text> or <Caption> from @components/ui/typography');
  });

  it('should respect allowlist when checking graph nodes', () => {
    const mockGraph: ModuleGraph = {
      nodes: new Map([
        [
          'features/legacy/LegacyView.tsx',
          {
            id: 'features/legacy/LegacyView.tsx',
            absolutePath: 'mock/path',
            topLevelDir: 'features',
            imports: [],
          },
        ],
      ]),
      adjacencyList: new Map(),
    };

    // When file is in allowlist, rule should not scan or report it
    const violations = rule.check(mockGraph, {
      allowlist: new Set(['features/legacy/LegacyView.tsx']),
    });

    expect(violations).toHaveLength(0);
  });

  it('should automatically skip files inside components/ui/', () => {
    const mockGraph: ModuleGraph = {
      nodes: new Map([
        [
          'components/ui/button.tsx',
          {
            id: 'components/ui/button.tsx',
            absolutePath: 'mock/path',
            topLevelDir: 'components',
            imports: [],
          },
        ],
      ]),
      adjacencyList: new Map(),
    };

    const violations = rule.check(mockGraph);
    expect(violations).toHaveLength(0);
  });

  it('should flag raw <form> and <aside> tags with appropriate component suggestions', () => {
    const code = `
export function FormAsideComponent() {
  return (
    <aside>
      <form onSubmit={() => {}}>
        <div>content</div>
      </form>
    </aside>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/FormAsideComponent.tsx');
    expect(violations).toHaveLength(2);
    expect(violations[0].target).toBe('aside');
    expect(violations[0].message).toContain('Use <Area as="aside">');
    expect(violations[1].target).toBe('form');
    expect(violations[1].message).toContain('Use <Form>');
  });

  it('should flag semantic heading, list, code, and kbd tags while allowing native strong and em', () => {
    const code = `
export function TypographyExample() {
  return (
    <div>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
      <ul>
        <li>Item</li>
      </ul>
      <ol>
        <li>Ordered Item</li>
      </ol>
      <strong>Bold</strong>
      <em>Italic</em>
      <code>inline code</code>
      <kbd>Ctrl</kbd>
    </div>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/TypographyExample.tsx');
    expect(violations.length).toBe(12);
    const tags = violations.map(v => v.target);
    expect(tags).toEqual([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'li', 'ol', 'li',
      'code', 'kbd',
    ]);
    expect(tags).not.toContain('strong');
    expect(tags).not.toContain('em');
  });

  it('should flag semantic layout containers and code block', () => {
    const code = `
export function LayoutExample() {
  return (
    <main>
      <header>Header</header>
      <nav>Nav</nav>
      <section>Section</section>
      <article>Article</article>
      <pre>Preformatted</pre>
      <footer>Footer</footer>
    </main>
  );
}
`;
    const violations = rule.scanAst(code, 'features/example/LayoutExample.tsx');
    expect(violations.length).toBe(7);
    const tags = violations.map(v => v.target);
    expect(tags).toEqual(['main', 'header', 'nav', 'section', 'article', 'pre', 'footer']);
  });
});
