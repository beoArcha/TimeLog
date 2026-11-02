import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { walkJsxTree, JsxElementContext } from '../core/jsx-walker';
import {
  COMPONENT_REGISTRY,
  getComponentMetadata,
  isDesignSystemComponent,
  getEffectiveContentCategory,
} from '../registry/component-registry';

function parseSource(code: string): ts.SourceFile {
  return ts.createSourceFile('test-file.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

interface VisitRecord {
  parentTag: string | null;
  parentEffectiveTag: string | null;
  childTag: string;
  childEffectiveTag: string;
  childAs?: string;
  isComponent: boolean;
}

function collectWalk(code: string): VisitRecord[] {
  const sourceFile = parseSource(code);
  const records: VisitRecord[] = [];

  walkJsxTree(sourceFile, (parent, child) => {
    records.push({
      parentTag: parent ? parent.tag : null,
      parentEffectiveTag: parent ? parent.effectiveTag : null,
      childTag: child.tag,
      childEffectiveTag: child.effectiveTag,
      childAs: child.as,
      isComponent: child.isComponent,
    });
  });

  return records;
}

describe('Component Metadata Registry', () => {
  it('contains expected Design System components and categories', () => {
    expect(COMPONENT_REGISTRY.VStack).toBeDefined();
    expect(COMPONENT_REGISTRY.VStack.defaultTag).toBe('div');
    expect(COMPONENT_REGISTRY.VStack.selfCategory).toBe('flow');
    expect(COMPONENT_REGISTRY.VStack.category).toBe('layout');
    expect(COMPONENT_REGISTRY.VStack.supportedAs).toContain('section');

    expect(COMPONENT_REGISTRY.Button).toBeDefined();
    expect(COMPONENT_REGISTRY.Button.defaultTag).toBe('button');
    expect(COMPONENT_REGISTRY.Button.selfCategory).toBe('interactive');
    expect(COMPONENT_REGISTRY.Button.forbiddenChildTags).toContain('button');
    expect(COMPONENT_REGISTRY.Button.forbiddenChildTags).toContain('div');

    expect(COMPONENT_REGISTRY.Heading).toBeDefined();
    expect(COMPONENT_REGISTRY.Heading.defaultTag).toBe('h2');
    expect(COMPONENT_REGISTRY.Heading.supportedAs).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

    expect(COMPONENT_REGISTRY.Table).toBeDefined();
    expect(COMPONENT_REGISTRY.Table.allowedChildTags).toContain('TableHeader');
    expect(COMPONENT_REGISTRY.Table.allowedChildTags).toContain('TableBody');
  });

  it('correctly resolves helpers: getComponentMetadata & isDesignSystemComponent', () => {
    expect(isDesignSystemComponent('HStack')).toBe(true);
    expect(isDesignSystemComponent('div')).toBe(false);
    expect(getComponentMetadata('Badge')?.defaultTag).toBe('div');
    expect(getComponentMetadata('Unknown')).toBeUndefined();
  });

  it('correctly calculates polymorphic effective content categories', () => {
    const textMeta = COMPONENT_REGISTRY.Text;
    expect(getEffectiveContentCategory(textMeta)).toBe('flow');
    expect(getEffectiveContentCategory(textMeta, 'span')).toBe('phrasing');
    expect(getEffectiveContentCategory(textMeta, 'p')).toBe('flow');

    const captionMeta = COMPONENT_REGISTRY.Caption;
    expect(getEffectiveContentCategory(captionMeta)).toBe('flow');
    expect(getEffectiveContentCategory(captionMeta, 'span')).toBe('phrasing');

    const vstackMeta = COMPONENT_REGISTRY.VStack;
    expect(getEffectiveContentCategory(vstackMeta, 'span')).toBe('flow');
  });
});

describe('AST JSX Walker', () => {
  describe('simple elements and raw primitives', () => {
    it('walks root self-closing and opening elements', () => {
      const code = `<Button>Submit</Button>`;
      const records = collectWalk(code);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual({
        parentTag: null,
        parentEffectiveTag: null,
        childTag: 'Button',
        childEffectiveTag: 'button',
        childAs: undefined,
        isComponent: true,
      });
    });

    it('identifies raw HTML tags vs component tags', () => {
      const code = `
        <div>
          <span>Text</span>
        </div>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject({
        parentTag: null,
        childTag: 'div',
        childEffectiveTag: 'div',
        isComponent: false,
      });
      expect(records[1]).toMatchObject({
        parentTag: 'div',
        childTag: 'span',
        childEffectiveTag: 'span',
        isComponent: false,
      });
    });

    it('extracts line and column numbers accurately', () => {
      const code = `const view = (\n  <VStack>\n    <Text>Hi</Text>\n  </VStack>\n);`;
      const sourceFile = parseSource(code);
      const contexts: JsxElementContext[] = [];

      walkJsxTree(sourceFile, (_parent, child) => {
        contexts.push(child);
      });

      expect(contexts).toHaveLength(2);
      expect(contexts[0].tag).toBe('VStack');
      expect(contexts[0].line).toBe(2);
      expect(contexts[0].column).toBe(3);

      expect(contexts[1].tag).toBe('Text');
      expect(contexts[1].line).toBe(3);
      expect(contexts[1].column).toBe(5);
    });
  });

  describe('nested layouts and parent stack tracking', () => {
    it('tracks nested hierarchy across multiple layers', () => {
      const code = `
        <VStack>
          <HStack>
            <Badge>New</Badge>
            <Text>Label</Text>
          </HStack>
          <Button>Action</Button>
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(5);

      // 1. VStack
      expect(records[0]).toMatchObject({
        parentTag: null,
        childTag: 'VStack',
        childEffectiveTag: 'div',
      });

      // 2. HStack under VStack
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'div',
        childTag: 'HStack',
        childEffectiveTag: 'div',
      });

      // 3. Badge under HStack
      expect(records[2]).toMatchObject({
        parentTag: 'HStack',
        parentEffectiveTag: 'div',
        childTag: 'Badge',
        childEffectiveTag: 'div',
      });

      // 4. Text under HStack
      expect(records[3]).toMatchObject({
        parentTag: 'HStack',
        parentEffectiveTag: 'div',
        childTag: 'Text',
        childEffectiveTag: 'p',
      });

      // 5. Button under VStack (after HStack is popped)
      expect(records[4]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'div',
        childTag: 'Button',
        childEffectiveTag: 'button',
      });
    });
  });

  describe('as prop detection and effective tag resolution', () => {
    it('extracts string literal as prop and overrides effectiveTag', () => {
      const code = `
        <VStack as="section">
          <Heading as="h1">Title</Heading>
          <Text as="span">Inline text</Text>
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records[0]).toMatchObject({
        childTag: 'VStack',
        childAs: 'section',
        childEffectiveTag: 'section',
      });

      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'section',
        childTag: 'Heading',
        childAs: 'h1',
        childEffectiveTag: 'h1',
      });

      expect(records[2]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'section',
        childTag: 'Text',
        childAs: 'span',
        childEffectiveTag: 'span',
      });
    });

    it('extracts JSX expression as prop (e.g. as={"aside"})', () => {
      const code = `<Area as={"aside"} />`;
      const records = collectWalk(code);

      expect(records[0]).toMatchObject({
        childTag: 'Area',
        childAs: 'aside',
        childEffectiveTag: 'aside',
      });
    });

    it('extracts identifier or member expression as prop (e.g. as={motion.div})', () => {
      const code = `<Area as={motion.div} />`;
      const records = collectWalk(code);

      expect(records[0]).toMatchObject({
        childTag: 'Area',
        childAs: 'motion.div',
        childEffectiveTag: 'motion.div',
      });
    });
  });

  describe('React.Fragment and <>...</> unwrapping', () => {
    it('unwraps <React.Fragment> so enclosing container remains effective parent', () => {
      const code = `
        <VStack>
          <React.Fragment>
            <Text>First</Text>
            <Text>Second</Text>
          </React.Fragment>
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(3);
      expect(records[0].childTag).toBe('VStack');

      // Both Text children have VStack as their direct effective parent
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Text',
      });
      expect(records[2]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Text',
      });
    });

    it('unwraps short syntax <>...</> fragments', () => {
      const code = `
        <InlineCluster>
          <>
            <Badge>One</Badge>
            <Badge>Two</Badge>
          </>
        </InlineCluster>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(3);
      expect(records[0].childTag).toBe('InlineCluster');
      expect(records[1]).toMatchObject({
        parentTag: 'InlineCluster',
        childTag: 'Badge',
      });
      expect(records[2]).toMatchObject({
        parentTag: 'InlineCluster',
        childTag: 'Badge',
      });
    });

    it('handles nested fragments transparently', () => {
      const code = `
        <VStack>
          <>
            <React.Fragment>
              <Text>Deeply nested</Text>
            </React.Fragment>
          </>
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(2);
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Text',
      });
    });

    it('handles top-level root fragments without error', () => {
      const code = `
        <>
          <VStack />
          <HStack />
        </>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject({
        parentTag: null,
        childTag: 'VStack',
      });
      expect(records[1]).toMatchObject({
        parentTag: null,
        childTag: 'HStack',
      });
    });
  });

  describe('array mapping unwrapping', () => {
    it('unwraps concise arrow function array mappings', () => {
      const code = `
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id} />
          ))}
        </TableBody>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(2);
      expect(records[0].childTag).toBe('TableBody');
      expect(records[1]).toMatchObject({
        parentTag: 'TableBody',
        parentEffectiveTag: 'tbody',
        childTag: 'TableRow',
        childEffectiveTag: 'tr',
      });
    });

    it('unwraps block body arrow function with return statement', () => {
      const code = `
        <VStack>
          {items.map(item => {
            const label = item.name;
            return <Text key={item.id}>{label}</Text>;
          })}
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(2);
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Text',
      });
    });

    it('unwraps multiple return branches inside map callback', () => {
      const code = `
        <VStack>
          {items.map(item => {
            if (item.badge) {
              return <Badge key={item.id} />;
            }
            return <StatusDot key={item.id} />;
          })}
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(3);
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Badge',
      });
      expect(records[2]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'StatusDot',
      });
    });

    it('handles nested mapping across component levels', () => {
      const code = `
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              {row.cells.map(cell => (
                <TableCell key={cell.id} />
              ))}
            </TableRow>
          ))}
        </TableBody>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(3);
      expect(records[0].childTag).toBe('TableBody');
      expect(records[1]).toMatchObject({
        parentTag: 'TableBody',
        childTag: 'TableRow',
      });
      expect(records[2]).toMatchObject({
        parentTag: 'TableRow',
        childTag: 'TableCell',
      });
    });
  });

  describe('conditional rendering unwrapping', () => {
    it('unwraps logical AND condition ({condition && <Child />})', () => {
      const code = `
        <VStack>
          {hasError && <Text>Error</Text>}
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(2);
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Text',
      });
    });

    it('unwraps ternary conditional expressions ({cond ? <A /> : <B />})', () => {
      const code = `
        <Button>
          {loading ? <StatusDot /> : <Text>Save</Text>}
        </Button>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(3);
      expect(records[0].childTag).toBe('Button');
      expect(records[1]).toMatchObject({
        parentTag: 'Button',
        childTag: 'StatusDot',
      });
      expect(records[2]).toMatchObject({
        parentTag: 'Button',
        childTag: 'Text',
      });
    });

    it('unwraps nested conditionals and fragments', () => {
      const code = `
        <VStack>
          {step === 1 ? (
            <React.Fragment>
              <Heading>Step 1</Heading>
              <Text>Intro</Text>
            </React.Fragment>
          ) : (
            <Button>Next</Button>
          )}
        </VStack>
      `;
      const records = collectWalk(code);

      expect(records).toHaveLength(4);
      expect(records[0].childTag).toBe('VStack');
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Heading',
      });
      expect(records[2]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Text',
      });
      expect(records[3]).toMatchObject({
        parentTag: 'VStack',
        childTag: 'Button',
      });
    });
  });

  describe('attributes with embedded JSX', () => {
    it('processes JSX inside props as root elements with independent stack', () => {
      const code = `
        <Area trigger={<Button><Text>Open</Text></Button>}>
          <Heading>Content</Heading>
        </Area>
      `;
      const records = collectWalk(code);

      // Trigger button is an attribute prop, so its parent is null
      const buttonRecord = records.find(r => r.childTag === 'Button');
      expect(buttonRecord).toBeDefined();
      expect(buttonRecord?.parentTag).toBeNull();

      // Text inside Button has Button as parent
      const buttonTextRecord = records.find(r => r.childTag === 'Text' && r.parentTag === 'Button');
      expect(buttonTextRecord).toBeDefined();

      // Heading inside Area has Area as parent
      const headingRecord = records.find(r => r.childTag === 'Heading');
      expect(headingRecord).toBeDefined();
      expect(headingRecord?.parentTag).toBe('Area');
    });
  });
});
