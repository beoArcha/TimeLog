import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import {
  walkJsxTree,
  validateJsxTree,
  JsxElementContext,
  ElementKind,
  WalkJsxOptions,
  classifyElement,
} from '../core/jsx-walker';
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
  isDynamicAs: boolean;
  asStatus: string;
  isComponent: boolean;
  elementKind: ElementKind;
}

function collectWalk(code: string, options?: WalkJsxOptions): VisitRecord[] {
  const sourceFile = parseSource(code);
  const records: VisitRecord[] = [];

  walkJsxTree(
    sourceFile,
    (parent, child) => {
      records.push({
        parentTag: parent ? parent.tag : null,
        parentEffectiveTag: parent ? parent.effectiveTag : null,
        childTag: child.tag,
        childEffectiveTag: child.effectiveTag,
        childAs: child.as,
        isDynamicAs: child.isDynamicAs,
        asStatus: child.asStatus,
        isComponent: child.isComponent,
        elementKind: child.elementKind,
      });
    },
    options
  );

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
    expect(getEffectiveContentCategory(textMeta, 'dynamic')).toBeUndefined();

    const captionMeta = COMPONENT_REGISTRY.Caption;
    expect(getEffectiveContentCategory(captionMeta)).toBe('flow');
    expect(getEffectiveContentCategory(captionMeta, 'span')).toBe('phrasing');
    expect(getEffectiveContentCategory(captionMeta, 'dynamic')).toBeUndefined();

    const badgeMeta = COMPONENT_REGISTRY.Badge;
    expect(getEffectiveContentCategory(badgeMeta)).toBe('flow');
    expect(getEffectiveContentCategory(badgeMeta, 'span')).toBe('phrasing');
    expect(getEffectiveContentCategory(badgeMeta, 'dynamic')).toBeUndefined();

    const vstackMeta = COMPONENT_REGISTRY.VStack;
    expect(getEffectiveContentCategory(vstackMeta, 'span')).toBe('phrasing');
    expect(getEffectiveContentCategory(vstackMeta, 'div')).toBe('flow');
    expect(getEffectiveContentCategory(vstackMeta, 'dynamic')).toBeUndefined();

    const hstackMeta = COMPONENT_REGISTRY.HStack;
    expect(getEffectiveContentCategory(hstackMeta, 'span')).toBe('phrasing');
    expect(getEffectiveContentCategory(hstackMeta, 'div')).toBe('flow');
    expect(getEffectiveContentCategory(hstackMeta, 'dynamic')).toBeUndefined();
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
        isDynamicAs: false,
        asStatus: 'none',
        isComponent: true,
        elementKind: 'registered-ds',
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
        elementKind: 'native-html',
      });
      expect(records[1]).toMatchObject({
        parentTag: 'div',
        childTag: 'span',
        childEffectiveTag: 'span',
        isComponent: false,
        elementKind: 'native-html',
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
        elementKind: 'registered-ds',
      });

      // 2. HStack under VStack
      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'div',
        childTag: 'HStack',
        childEffectiveTag: 'div',
        elementKind: 'registered-ds',
      });

      // 3. Badge under HStack
      expect(records[2]).toMatchObject({
        parentTag: 'HStack',
        parentEffectiveTag: 'div',
        childTag: 'Badge',
        childEffectiveTag: 'div',
        elementKind: 'registered-ds',
      });

      // 4. Text under HStack
      expect(records[3]).toMatchObject({
        parentTag: 'HStack',
        parentEffectiveTag: 'div',
        childTag: 'Text',
        childEffectiveTag: 'p',
        elementKind: 'registered-ds',
      });

      // 5. Button under VStack (after HStack is popped)
      expect(records[4]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'div',
        childTag: 'Button',
        childEffectiveTag: 'button',
        elementKind: 'registered-ds',
      });
    });
  });

  describe('as prop detection and safe effective tag resolution', () => {
    it('extracts static string literal as prop and overrides effectiveTag', () => {
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
        isDynamicAs: false,
        asStatus: 'resolved',
        childEffectiveTag: 'section',
      });

      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'section',
        childTag: 'Heading',
        childAs: 'h1',
        isDynamicAs: false,
        asStatus: 'resolved',
        childEffectiveTag: 'h1',
      });

      expect(records[2]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'section',
        childTag: 'Text',
        childAs: 'span',
        isDynamicAs: false,
        asStatus: 'resolved',
        childEffectiveTag: 'span',
      });
    });

    it('extracts static JSX string expression as prop (e.g. as={"aside"})', () => {
      const code = `<Area as={"aside"} />`;
      const records = collectWalk(code);

      expect(records[0]).toMatchObject({
        childTag: 'Area',
        childAs: 'aside',
        isDynamicAs: false,
        asStatus: 'resolved',
        childEffectiveTag: 'aside',
      });
    });

    it('resolves dynamic identifiers as explicit "dynamic" state without guessing tag', () => {
      const code = `<Area as={layoutTag} />`;
      const records = collectWalk(code);

      expect(records[0]).toMatchObject({
        childTag: 'Area',
        childAs: 'dynamic',
        isDynamicAs: true,
        asStatus: 'dynamic',
        childEffectiveTag: 'dynamic',
      });
    });

    it('resolves dynamic ternary expressions as "dynamic"', () => {
      const code = `<Heading as={isHeader ? "h1" : "h2"} />`;
      const records = collectWalk(code);

      expect(records[0]).toMatchObject({
        childTag: 'Heading',
        childAs: 'dynamic',
        isDynamicAs: true,
        asStatus: 'dynamic',
        childEffectiveTag: 'dynamic',
      });
    });

    it('resolves member expressions and call expressions in as prop as "dynamic"', () => {
      const code = `
        <div>
          <Area as={motion.div} />
          <VStack as={getTag()} />
          <HStack as={components[type]} />
        </div>
      `;
      const records = collectWalk(code);

      expect(records[1]).toMatchObject({
        childTag: 'Area',
        childAs: 'dynamic',
        isDynamicAs: true,
        asStatus: 'dynamic',
        childEffectiveTag: 'dynamic',
      });

      expect(records[2]).toMatchObject({
        childTag: 'VStack',
        childAs: 'dynamic',
        isDynamicAs: true,
        asStatus: 'dynamic',
        childEffectiveTag: 'dynamic',
      });

      expect(records[3]).toMatchObject({
        childTag: 'HStack',
        childAs: 'dynamic',
        isDynamicAs: true,
        asStatus: 'dynamic',
        childEffectiveTag: 'dynamic',
      });
    });

    it('preserves invalid as prop values as an explicit invalid state', () => {
      const code = `
        <div>
          <VStack as />
          <VStack as={123} />
          <Button as={true} />
          <Text as="" />
          <Text as="   " />
          <Heading as={null} />
        </div>
      `;
      const records = collectWalk(code);

      // 1. <VStack as />
      expect(records[1]).toMatchObject({
        childTag: 'VStack',
        childAs: undefined,
        isDynamicAs: false,
        asStatus: 'invalid',
        childEffectiveTag: 'invalid',
      });

      // 2. <VStack as={123} />
      expect(records[2]).toMatchObject({
        childTag: 'VStack',
        childAs: undefined,
        isDynamicAs: false,
        asStatus: 'invalid',
        childEffectiveTag: 'invalid',
      });

      // 3. <Button as={true} />
      expect(records[3]).toMatchObject({
        childTag: 'Button',
        childAs: undefined,
        isDynamicAs: false,
        asStatus: 'invalid',
        childEffectiveTag: 'invalid',
      });

      // 4. <Text as="" />
      expect(records[4]).toMatchObject({
        childTag: 'Text',
        childAs: undefined,
        isDynamicAs: false,
        asStatus: 'invalid',
        childEffectiveTag: 'invalid',
      });

      // 5. <Text as="   " />
      expect(records[5]).toMatchObject({
        childTag: 'Text',
        childAs: undefined,
        isDynamicAs: false,
        asStatus: 'invalid',
        childEffectiveTag: 'invalid',
      });

      // 6. <Heading as={null} />
      expect(records[6]).toMatchObject({
        childTag: 'Heading',
        childAs: undefined,
        isDynamicAs: false,
        asStatus: 'invalid',
        childEffectiveTag: 'invalid',
      });
    });
  });

  describe('supported as prop validation', () => {
    it('accepts static overrides declared in the component registry', () => {
      const records = collectWalk(`
        <VStack as="section" />
        <Heading as="h1" />
        <Text as="span" />
      `);
      expect(records.map(record => [record.asStatus, record.childEffectiveTag])).toEqual([
        ['resolved', 'section'],
        ['resolved', 'h1'],
        ['resolved', 'span'],
      ]);
    });

    it('marks registered components with unsupported static overrides explicitly', () => {
      const records = collectWalk(`
        <VStack as="table" />
        <Button as="a" />
      `);
      expect(records.map(record => [record.asStatus, record.childEffectiveTag])).toEqual([
        ['unsupported', 'unsupported'],
        ['unsupported', 'unsupported'],
      ]);
      expect(records[0].childAs).toBe('table');
      expect(records[1].childAs).toBe('a');
    });

    it('rejects static as on components that do not declare supportedAs in registry', () => {
      const records = collectWalk(`
        <Button as="button" />
        <Button as="div" />
        <NativeSelect as="select" />
        <NativeOption as="option" />
      `);
      expect(records.map(record => [record.asStatus, record.childEffectiveTag])).toEqual([
        ['unsupported', 'unsupported'],
        ['unsupported', 'unsupported'],
        ['unsupported', 'unsupported'],
        ['unsupported', 'unsupported'],
      ]);
    });

    it('does not apply Design System restrictions to unresolved components', () => {
      const records = collectWalk(`<CustomWidget as="article" />`);
      expect(records[0]).toMatchObject({
        asStatus: 'resolved',
        childEffectiveTag: 'article',
        elementKind: 'unresolved-component',
      });
    });
  });

  describe('elementKind classification', () => {
    it('classifies native HTML lowercase elements as "native-html"', () => {
      const code = `
        <div>
          <span>Text</span>
          <h2>Heading</h2>
          <section><p>Para</p></section>
        </div>
      `;
      const records = collectWalk(code);

      for (const rec of records) {
        expect(rec.elementKind).toBe('native-html');
        expect(rec.isComponent).toBe(false);
      }
    });

    it('classifies registered Design System components as "registered-ds"', () => {
      const code = `
        <VStack>
          <HStack>
            <Badge>New</Badge>
            <Text>Content</Text>
          </HStack>
          <Button>Click</Button>
          <Table />
        </VStack>
      `;
      const records = collectWalk(code);

      for (const rec of records) {
        expect(rec.elementKind).toBe('registered-ds');
        expect(rec.isComponent).toBe(true);
      }
    });

    it('classifies known third-party external components as "known-external"', () => {
      const code = `
        <div>
          <Smile />
          <BarChart />
          <ResponsiveContainer />
          <motion.div />
          <AnimatePresence />
        </div>
      `;
      const records = collectWalk(code);

      const smileRec = records.find(r => r.childTag === 'Smile');
      expect(smileRec?.elementKind).toBe('known-external');
      expect(smileRec?.isComponent).toBe(true);

      const chartRec = records.find(r => r.childTag === 'BarChart');
      expect(chartRec?.elementKind).toBe('known-external');

      const motionRec = records.find(r => r.childTag === 'motion.div');
      expect(motionRec?.elementKind).toBe('known-external');
    });

    it('classifies imported external library components as "known-external"', () => {
      const code = `
        import { CustomIcon } from 'lucide-react';
        import * as Recharts from 'recharts';
        import { Toaster } from 'sonner';

        <div>
          <CustomIcon />
          <Recharts.PieChart />
          <Toaster />
        </div>
      `;
      const records = collectWalk(code);

      const iconRec = records.find(r => r.childTag === 'CustomIcon');
      expect(iconRec?.elementKind).toBe('known-external');
      expect(iconRec?.isComponent).toBe(true);

      const pieRec = records.find(r => r.childTag === 'Recharts.PieChart');
      expect(pieRec?.elementKind).toBe('known-external');

      const toastRec = records.find(r => r.childTag === 'Toaster');
      expect(toastRec?.elementKind).toBe('known-external');
    });

    it('does NOT classify unknown custom components as native HTML', () => {
      const code = `
        <div>
          <CustomWidget />
          <UserCard />
          <UnresolvedDashboardHeader />
        </div>
      `;
      const records = collectWalk(code);

      const customWidget = records.find(r => r.childTag === 'CustomWidget');
      expect(customWidget?.elementKind).toBe('unresolved-component');
      expect(customWidget?.elementKind).not.toBe('native-html');
      expect(customWidget?.isComponent).toBe(true);

      const userCard = records.find(r => r.childTag === 'UserCard');
      expect(userCard?.elementKind).toBe('unresolved-component');
      expect(userCard?.elementKind).not.toBe('native-html');

      const dashboardHeader = records.find(r => r.childTag === 'UnresolvedDashboardHeader');
      expect(dashboardHeader?.elementKind).toBe('unresolved-component');
      expect(dashboardHeader?.elementKind).not.toBe('native-html');
    });

    it('classifyElement helper directly returns expected elementKind', () => {
      expect(classifyElement('div')).toBe('native-html');
      expect(classifyElement('span')).toBe('native-html');
      expect(classifyElement('VStack')).toBe('registered-ds');
      expect(classifyElement('Button')).toBe('registered-ds');
      expect(classifyElement('Smile')).toBe('known-external');
      expect(classifyElement('motion.div')).toBe('known-external');
      expect(classifyElement('CustomWidget')).toBe('unresolved-component');
      expect(classifyElement('MyCustomProfile')).toBe('unresolved-component');
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

  describe('rendered slot and callback analysis (.map vs non-render callbacks)', () => {
    it('unwraps concise arrow function array mappings as rendered children', () => {
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

    it('unwraps block body arrow function with return statement in .map()', () => {
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

    it('NEGATIVE: does NOT traverse arbitrary callbacks like onClick or useEffect returning JSX', () => {
      const code = `
        <VStack>
          <Button onClick={() => <ModalDialog />}>Open Modal</Button>
          {useEffect(() => {
            return () => <UnmountedCleanupView />;
          })}
          {someArbitraryHelper(() => <HelperElement />)}
          <Text>Always Rendered</Text>
        </VStack>
      `;
      const records = collectWalk(code);

      const tagNames = records.map(r => r.childTag);

      // Verified present:
      expect(tagNames).toContain('VStack');
      expect(tagNames).toContain('Button');
      expect(tagNames).toContain('Text');

      // Verified NOT traversed (non-render callbacks):
      expect(tagNames).not.toContain('ModalDialog');
      expect(tagNames).not.toContain('UnmountedCleanupView');
      expect(tagNames).not.toContain('HelperElement');
    });

    it('NEGATIVE: does NOT traverse event handler props returning JSX (e.g. onKeyDown, onChange)', () => {
      const code = `
        <div onKeyDown={() => <TooltipContent />} onChange={() => { return <PopupView />; }}>
          <span>Input</span>
        </div>
      `;
      const records = collectWalk(code);

      const tagNames = records.map(r => r.childTag);
      expect(tagNames).toContain('div');
      expect(tagNames).toContain('span');
      expect(tagNames).not.toContain('TooltipContent');
      expect(tagNames).not.toContain('PopupView');
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

  describe('attributes with embedded JSX slots', () => {
    it('processes static JSX inside props as root elements with independent stack', () => {
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

  describe('JSX validator and content model enforcement', () => {
    function getValidationErrors(code: string) {
      const sourceFile = parseSource(code);
      return validateJsxTree(sourceFile);
    }

    it('confirms correct NativeSelect with NativeOption and NativeOptGroup produces no errors', () => {
      const code = `
        <NativeSelect>
          <NativeOption value="a">A</NativeOption>
          <NativeOptGroup label="Group B">
            <NativeOption value="b">B</NativeOption>
          </NativeOptGroup>
        </NativeSelect>
      `;
      const errors = getValidationErrors(code);
      expect(errors).toEqual([]);
    });

    it('detects NativeOption outside NativeSelect as invalid nesting', () => {
      const code = `
        <div>
          <NativeOption value="orphan">Orphan Option</NativeOption>
        </div>
      `;
      const errors = getValidationErrors(code);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(
          e => e.rule === 'invalid-nesting' && e.tag === 'NativeOption' && e.parentTag === 'div'
        )
      ).toBe(true);
    });

    it('detects root-level NativeOption outside any select container', () => {
      const rootCode = `<NativeOption value="root">Root Option</NativeOption>`;
      const rootErrors = getValidationErrors(rootCode);
      expect(rootErrors.length).toBeGreaterThan(0);
      expect(
        rootErrors.some(
          e => e.rule === 'invalid-nesting' && e.tag === 'NativeOption' && e.parentTag === null
        )
      ).toBe(true);
    });

    it('detects NativeOptGroup outside NativeSelect as invalid nesting', () => {
      const code = `
        <VStack>
          <NativeOptGroup label="Orphan Group">
            <NativeOption value="nested">Nested</NativeOption>
          </NativeOptGroup>
        </VStack>
      `;
      const errors = getValidationErrors(code);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(
          e => e.rule === 'invalid-nesting' && e.tag === 'NativeOptGroup' && e.parentTag === 'VStack'
        )
      ).toBe(true);
    });

    it('detects block elements, interactive components, and typography inside NativeOption', () => {
      const code = `
        <NativeSelect>
          <NativeOption value="bad">
            <div>Invalid Block Child</div>
            <Button>Invalid Button Child</Button>
            <Heading>Invalid Heading Child</Heading>
            <span>Invalid Span Child</span>
          </NativeOption>
        </NativeSelect>
      `;
      const errors = getValidationErrors(code);
      const optionChildErrors = errors.filter(e => e.parentTag === 'NativeOption');

      expect(optionChildErrors).toHaveLength(4);
      for (const err of optionChildErrors) {
        expect(err.rule).toBe('invalid-nesting');
        expect(err.message).toContain('accepts text content only');
      }
    });

    it('detects disallowed non-option children inside NativeOptGroup', () => {
      const code = `
        <NativeSelect>
          <NativeOptGroup label="Invalid Group">
            <div>Invalid div</div>
            <Button>Invalid Button</Button>
            <NativeOptGroup label="Nested group (invalid)">
              <NativeOption value="1">1</NativeOption>
            </NativeOptGroup>
          </NativeOptGroup>
        </NativeSelect>
      `;
      const errors = getValidationErrors(code);
      const optGroupErrors = errors.filter(e => e.parentTag === 'NativeOptGroup');

      expect(optGroupErrors.length).toBeGreaterThanOrEqual(3);
      expect(optGroupErrors.some(e => e.tag === 'div')).toBe(true);
      expect(optGroupErrors.some(e => e.tag === 'Button')).toBe(true);
      expect(optGroupErrors.some(e => e.tag === 'NativeOptGroup')).toBe(true);
    });

    it('detects unsupported as prop values as validation errors', () => {
      const code = `
        <div>
          <VStack as="table" />
          <Button as="div" />
          <NativeSelect as="input" />
        </div>
      `;
      const errors = getValidationErrors(code);
      const asErrors = errors.filter(e => e.rule === 'unsupported-as');

      expect(asErrors).toHaveLength(3);
      expect(asErrors.map(e => e.tag)).toEqual(['VStack', 'Button', 'NativeSelect']);
    });

    describe('Regression: Native HTML element and dynamic as validation', () => {
      it('rejects native <input /> inside <Button> as a violation', () => {
        const code = `<Button><input type="text" /></Button>`;
        const errors = getValidationErrors(code);

        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            e =>
              (e.rule === 'invalid-nesting' || e.rule === 'forbidden-child') &&
              e.tag === 'input' &&
              e.parentTag === 'Button'
          )
        ).toBe(true);
      });

      it('allows valid phrasing native <span /> inside <Button>', () => {
        const code = `<Button><span>Click me</span></Button>`;
        const errors = getValidationErrors(code);

        expect(errors).toEqual([]);
      });

      it('does not infer effective content category from default tag when as is dynamic', () => {
        // Text defaults to tag 'p' (flow), which is normally forbidden inside Button (phrasing).
        // With dynamic as={dynamicTag}, the category is unknown and must not be assumed as flow.
        const dynamicCode = `
          <Button>
            <Text as={dynamicTag}>Dynamic Text</Text>
          </Button>
        `;
        const dynamicErrors = getValidationErrors(dynamicCode);
        const textCategoryErrors = dynamicErrors.filter(
          e => e.tag === 'Text' && e.parentTag === 'Button' && e.rule === 'invalid-nesting'
        );
        expect(textCategoryErrors).toEqual([]);

        // In contrast, static Text without as defaults to p (flow) and MUST produce an invalid-nesting error inside Button
        const staticCode = `
          <Button>
            <Text>Static Flow Text</Text>
          </Button>
        `;
        const staticErrors = getValidationErrors(staticCode);
        expect(
          staticErrors.some(
            e =>
              e.tag === 'Text' &&
              e.parentTag === 'Button' &&
              e.rule === 'invalid-nesting' &&
              e.message.includes('flow')
          )
        ).toBe(true);
      });

      it('rejects disallowed native HTML elements inside NativeOptGroup', () => {
        const code = `
          <NativeSelect>
            <NativeOptGroup label="Test Group">
              <span />
              <input />
              <p>Disallowed paragraph</p>
              <NativeOption value="ok">Valid Option</NativeOption>
            </NativeOptGroup>
          </NativeSelect>
        `;
        const errors = getValidationErrors(code);
        const optGroupErrors = errors.filter(e => e.parentTag === 'NativeOptGroup');

        expect(optGroupErrors.length).toBeGreaterThanOrEqual(3);
        expect(optGroupErrors.some(e => e.tag === 'span')).toBe(true);
        expect(optGroupErrors.some(e => e.tag === 'input')).toBe(true);
        expect(optGroupErrors.some(e => e.tag === 'p')).toBe(true);
        expect(optGroupErrors.some(e => e.tag === 'NativeOption')).toBe(false);
      });

      it('allows HStack and VStack with explicit phrasing override as="span" inside Heading and Label', () => {
        const code = `
          <Heading><HStack as="span"><span>Title</span></HStack></Heading>
          <Label><VStack as="span"><span>Label text</span></VStack></Label>
        `;
        const errors = getValidationErrors(code);
        expect(errors).toEqual([]);
      });

      it('rejects default HStack and VStack (flow) inside Heading and Label', () => {
        const code = `
          <Heading><HStack><span>Title</span></HStack></Heading>
          <Label><VStack><span>Label text</span></VStack></Label>
        `;
        const errors = getValidationErrors(code);
        expect(errors.length).toBeGreaterThanOrEqual(2);
        expect(errors.some(e => e.parentTag === 'Heading' && e.tag === 'HStack')).toBe(true);
        expect(errors.some(e => e.parentTag === 'Label' && e.tag === 'VStack')).toBe(true);
      });
    });

    describe('PR #32: Effective HTML element validation and content model enforcement', () => {
      it('allows VStack as="span" with valid phrasing children', () => {
        const code = `
          <VStack as="span">
            <span>Phrasing span</span>
            <Text as="span">Inline text</Text>
            <Button>Action button</Button>
            <strong>Strong text</strong>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        expect(errors).toEqual([]);
      });

      it('rejects flow children (such as nested <div>) inside VStack as="span"', () => {
        const code = `
          <VStack as="span">
            <div>Nested flow div</div>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        expect(errors.length).toBeGreaterThanOrEqual(1);
        expect(
          errors.some(
            e =>
              e.rule === 'forbidden-child' &&
              e.tag === 'div' &&
              e.parentTag === 'VStack'
          )
        ).toBe(true);
      });

      it('rejects multiple flow elements inside VStack as="span"', () => {
        const code = `
          <VStack as="span">
            <p>Paragraph</p>
            <VStack>Nested VStack</VStack>
            <Text>Default p text</Text>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        expect(errors.length).toBeGreaterThanOrEqual(3);
        expect(errors.some(e => e.tag === 'p' && e.parentTag === 'VStack')).toBe(true);
        expect(errors.some(e => e.tag === 'VStack' && e.parentTag === 'VStack')).toBe(true);
        expect(errors.some(e => e.tag === 'Text' && e.parentTag === 'VStack')).toBe(true);
      });

      it('allows valid list item children inside VStack as="ul" and VStack as="ol"', () => {
        const code = `
          <div>
            <VStack as="ul">
              <li>Item 1</li>
              <ListItem>Item 2</ListItem>
              <VStack as="li">Nested list item</VStack>
            </VStack>
            <VStack as="ol">
              <li>Ordered item 1</li>
              <ListItem>Ordered item 2</ListItem>
            </VStack>
          </div>
        `;
        const errors = getValidationErrors(code);
        expect(errors).toEqual([]);
      });

      it('rejects non-list-item children inside VStack as="ul"', () => {
        const code = `
          <VStack as="ul">
            <div>Disallowed div</div>
            <p>Disallowed paragraph</p>
            <span>Disallowed span</span>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        expect(errors.length).toBe(3);
        for (const err of errors) {
          expect(err.rule).toBe('invalid-nesting');
          expect(err.parentTag).toBe('VStack');
          expect(err.message).toContain('Allowed tags: li, ListItem');
        }
      });

      it('rejects non-list-item children inside VStack as="ol"', () => {
        const code = `
          <VStack as="ol">
            <div>Disallowed div in ol</div>
            <Text>Disallowed text in ol</Text>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        expect(errors.length).toBe(2);
        for (const err of errors) {
          expect(err.rule).toBe('invalid-nesting');
          expect(err.parentTag).toBe('VStack');
          expect(err.message).toContain('Allowed tags: li, ListItem');
        }
      });

      it('enforces native list element rules on <menu>, <ul>, and <ol>', () => {
        const validCode = `
          <div>
            <menu>
              <li>Menu item</li>
              <ListItem>Design system list item</ListItem>
            </menu>
            <ul>
              <li>Unordered item</li>
            </ul>
            <ol>
              <li>Ordered item</li>
            </ol>
          </div>
        `;
        expect(getValidationErrors(validCode)).toEqual([]);

        const invalidCode = `
          <div>
            <menu>
              <div>Disallowed div inside menu</div>
            </menu>
            <ul>
              <span>Disallowed span inside ul</span>
            </ul>
            <ol>
              <p>Disallowed p inside ol</p>
            </ol>
          </div>
        `;
        const invalidErrors = getValidationErrors(invalidCode);
        expect(invalidErrors.length).toBe(3);
        expect(invalidErrors.some(e => e.parentTag === 'menu' && e.tag === 'div')).toBe(true);
        expect(invalidErrors.some(e => e.parentTag === 'ul' && e.tag === 'span')).toBe(true);
        expect(invalidErrors.some(e => e.parentTag === 'ol' && e.tag === 'p')).toBe(true);
      });

      it('correctly validates newly classified HTML elements without false positives', () => {
        const code = `
          <div>
            <dialog>
              <p>Modal content</p>
            </dialog>
            <search>
              <form>
                <input type="search" />
              </form>
            </search>
            <p>
              <data value="123">123 items</data>
              <output>Result</output>
              <progress value="50" max="100" />
              <meter value="0.6">60%</meter>
              <dfn>Definition</dfn>
            </p>
          </div>
        `;
        const errors = getValidationErrors(code);
        expect(errors).toEqual([]);
      });

      it('does not assume default tag or enforce child constraints when parent as is dynamic', () => {
        const code = `
          <VStack as={dynamicTag}>
            <div>Dynamic parent allows flow div</div>
            <p>Dynamic parent allows paragraph</p>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        // Because as is dynamic, parent constraints should NOT assume default 'div' or any specific tag
        expect(errors.filter(e => e.parentTag === 'VStack')).toEqual([]);
      });

      it('does not reject children with dynamic as when nested inside constrained parents', () => {
        const code = `
          <VStack as="ul">
            <Text as={dynamicTag}>Dynamic tag may evaluate to li</Text>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        // Child has dynamic as, so it should not be assumed as p (flow) and rejected
        expect(errors).toEqual([]);
      });

      it('does not apply native HTML constraints to custom unresolved components matching native names', () => {
        // e.g. Custom Radix-style <Select> with <SelectTrigger> and <SelectContent>
        const code = `
          <Select>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">One</SelectItem>
            </SelectContent>
          </Select>
        `;
        const errors = getValidationErrors(code);
        // Custom component <Select> must not be treated as native HTML <select> requiring NativeOption
        expect(errors).toEqual([]);
      });

      it('reports unsupported as prop values on polymorphic components', () => {
        const code = `
          <VStack as="table">
            <div>Table content</div>
          </VStack>
        `;
        const errors = getValidationErrors(code);
        expect(errors.some(e => e.rule === 'unsupported-as' && e.tag === 'VStack')).toBe(true);
      });
    });

    describe('PR #32: HTML Content Model Final Corrections Regression Tests', () => {
      it('rejects <span><details /></span> because details is flow, not phrasing', () => {
        const code = `
          <span>
            <details>
              <summary>Click me</summary>
              <p>Details content</p>
            </details>
          </span>
        `;
        const errors = getValidationErrors(code);
        expect(
          errors.some(
            e =>
              e.tag === 'details' &&
              e.parentTag === 'span' &&
              (e.rule === 'invalid-nesting' || e.rule === 'forbidden-child')
          )
        ).toBe(true);
      });

      it('accepts valid phrasing content inside <span>', () => {
        const code = `
          <span>
            <strong>Bold text</strong>
            <em>Emphasis</em>
            <span>Nested span</span>
            <a href="#">Link</a>
            <code>const x = 1;</code>
            <time>12:00</time>
          </span>
        `;
        const errors = getValidationErrors(code);
        expect(errors).toEqual([]);
      });

      it('enforces structural constraints on polymorphic components', () => {
        // VStack as="span" applies phrasing-only constraints
        const badVStackSpan = `
          <VStack as="span">
            <details>
              <summary>Bad</summary>
            </details>
          </VStack>
        `;
        const spanErrors = getValidationErrors(badVStackSpan);
        expect(spanErrors.length).toBeGreaterThan(0);

        const goodVStackSpan = `
          <VStack as="span">
            <span>Phrasing</span>
            <strong>Bold</strong>
          </VStack>
        `;
        expect(getValidationErrors(goodVStackSpan)).toEqual([]);

        // VStack as="ul" applies list constraints
        const badVStackUl = `
          <VStack as="ul">
            <div>Invalid direct div child of list</div>
          </VStack>
        `;
        const ulErrors = getValidationErrors(badVStackUl);
        expect(ulErrors.some(e => e.rule === 'invalid-nesting' && e.parentTag === 'VStack')).toBe(true);

        const goodVStackUl = `
          <VStack as="ul">
            <li>Item 1</li>
            <ListItem>Item 2</ListItem>
          </VStack>
        `;
        expect(getValidationErrors(goodVStackUl)).toEqual([]);

        // VStack as="ol" applies list constraints
        const badVStackOl = `
          <VStack as="ol">
            <p>Invalid direct p child of list</p>
          </VStack>
        `;
        const olErrors = getValidationErrors(badVStackOl);
        expect(olErrors.some(e => e.rule === 'invalid-nesting' && e.parentTag === 'VStack')).toBe(true);

        const goodVStackOl = `
          <VStack as="ol">
            <li>Item 1</li>
          </VStack>
        `;
        expect(getValidationErrors(goodVStackOl)).toEqual([]);
      });

      it('ensures dynamic as does not inherit constraints from defaultTag', () => {
        const dynamicCode = `
          const dynamicTag: any = 'div';
          const element = (
            <VStack as={dynamicTag}>
              <div>Any content is safe when tag is unknown</div>
            </VStack>
          );
        `;
        expect(getValidationErrors(dynamicCode)).toEqual([]);
      });

      it('preserves valid Design System component overrides and nesting', () => {
        const dsCode = `
          <VStack>
            <HStack>
              <Badge as="span">Active</Badge>
              <Text as="span">Inline label</Text>
            </HStack>
            <Button>
              <span>Click Me</span>
            </Button>
          </VStack>
        `;
        expect(getValidationErrors(dsCode)).toEqual([]);
      });
    });
  });
});
