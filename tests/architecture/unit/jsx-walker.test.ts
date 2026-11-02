import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import {
  walkJsxTree,
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

    const captionMeta = COMPONENT_REGISTRY.Caption;
    expect(getEffectiveContentCategory(captionMeta)).toBe('flow');
    expect(getEffectiveContentCategory(captionMeta, 'span')).toBe('phrasing');

    const badgeMeta = COMPONENT_REGISTRY.Badge;
    expect(getEffectiveContentCategory(badgeMeta)).toBe('flow');
    expect(getEffectiveContentCategory(badgeMeta, 'span')).toBe('phrasing');

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
        isDynamicAs: false,
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
        <VStack>\n          <HStack>\n            <Badge>New</Badge>\n            <Text>Label</Text>\n          </HStack>\n          <Button>Action</Button>\n        </VStack>
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
        childEffectiveTag: 'section',
      });

      expect(records[1]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'section',
        childTag: 'Heading',
        childAs: 'h1',
        isDynamicAs: false,
        childEffectiveTag: 'h1',
      });

      expect(records[2]).toMatchObject({
        parentTag: 'VStack',
        parentEffectiveTag: 'section',
        childTag: 'Text',
        childAs: 'span',
        isDynamicAs: false,
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
        childEffectiveTag: 'dynamic',
      });

      expect(records[2]).toMatchObject({
        childTag: 'VStack',
        childAs: 'dynamic',
        isDynamicAs: true,
        childEffectiveTag: 'dynamic',
      });

      expect(records[3]).toMatchObject({
        childTag: 'HStack',
        childAs: 'dynamic',
        isDynamicAs: true,
        childEffectiveTag: 'dynamic',
      });
    });

    it('handles invalid as prop values safely by falling back to defaultTag without guessing', () => {
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
        childEffectiveTag: 'div',
      });

      // 2. <VStack as={123} />
      expect(records[2]).toMatchObject({
        childTag: 'VStack',
        childAs: undefined,
        isDynamicAs: false,
        childEffectiveTag: 'div',
      });

      // 3. <Button as={true} />
      expect(records[3]).toMatchObject({
        childTag: 'Button',
        childAs: undefined,
        isDynamicAs: false,
        childEffectiveTag: 'button',
      });

      // 4. <Text as="" />
      expect(records[4]).toMatchObject({
        childTag: 'Text',
        childAs: undefined,
        isDynamicAs: false,
        childEffectiveTag: 'p',
      });

      // 5. <Text as="   " />
      expect(records[5]).toMatchObject({
        childTag: 'Text',
        childAs: undefined,
        isDynamicAs: false,
        childEffectiveTag: 'p',
      });

      // 6. <Heading as={null} />
      expect(records[6]).toMatchObject({
        childTag: 'Heading',
        childAs: undefined,
        isDynamicAs: false,
        childEffectiveTag: 'h2',
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
});
