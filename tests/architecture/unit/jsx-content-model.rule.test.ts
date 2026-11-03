import { describe, it, expect } from 'vitest';
import {
  JsxContentModelRule,
  LEGACY_JSX_CONTENT_MODEL_ALLOWLIST,
} from '../rules/jsx-content-model.rule';
import { ModuleGraph } from '../core/types';

describe('Unit Tests: JsxContentModelRule', () => {
  const rule = new JsxContentModelRule();

  it('exposes expected rule metadata', () => {
    expect(rule.name).toBe('jsx-content-model');
    expect(rule.description).toBeDefined();
    expect(rule.description.length).toBeGreaterThan(0);
    expect(LEGACY_JSX_CONTENT_MODEL_ALLOWLIST).toBeDefined();
    expect(LEGACY_JSX_CONTENT_MODEL_ALLOWLIST.size).toBeGreaterThan(0);
  });

  describe('valid JSX content model structures (positive cases)', () => {
    it('produces no violations for valid Design System nesting', () => {
      const code = `
import React from 'react';
import { VStack, HStack } from '@components/ui/stack';
import { Heading, Text } from '@components/ui/typography';
import { Button } from '@components/ui/button';

export function ValidComponent() {
  return (
    <VStack>
      <Heading>Section Title</Heading>
      <HStack>
        <Text>Description text</Text>
        <Button>
          <Text as="span">Click me</Text>
        </Button>
      </HStack>
    </VStack>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/ValidComponent.tsx');
      expect(violations).toEqual([]);
    });

    it('allows HStack as="span" inside Heading and VStack as="span" inside Label', () => {
      const code = `
import React from 'react';
import { Heading } from '@components/ui/typography';
import { Label } from '@components/ui/label';
import { HStack, VStack } from '@components/ui/stack';

export function PhrasingLayoutOverride() {
  return (
    <div>
      <Heading>
        <HStack as="span">
          <span>Icon</span>
          <span>Header Content</span>
        </HStack>
      </Heading>
      <Label>
        <VStack as="span">
          <span>Field Title</span>
          <span>Field Hint</span>
        </VStack>
      </Label>
    </div>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/PhrasingLayoutOverride.tsx');
      expect(violations).toEqual([]);
    });

    it('allows valid NativeSelect with NativeOption and NativeOptGroup', () => {
      const code = `
import React from 'react';
import { NativeSelect, NativeOption, NativeOptGroup } from '@components/ui/native-select';

export function ValidSelect() {
  return (
    <NativeSelect>
      <NativeOption value="opt1">Option 1</NativeOption>
      <NativeOptGroup label="Group A">
        <NativeOption value="opt2">Option 2</NativeOption>
      </NativeOptGroup>
    </NativeSelect>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/ValidSelect.tsx');
      expect(violations).toEqual([]);
    });

    it('allows valid children according to effective HTML element on polymorphic components', () => {
      const code = `
import React from 'react';
import { VStack } from '@components/ui/stack';
import { ListItem } from '@components/ui/typography';

export function EffectiveTagValid() {
  return (
    <div>
      <VStack as="span">
        <span>Valid phrasing span</span>
      </VStack>
      <VStack as="ul">
        <li>Valid native list item</li>
        <ListItem>Valid design system list item</ListItem>
      </VStack>
    </div>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/EffectiveTagValid.tsx');
      expect(violations).toEqual([]);
    });
  });

  describe('invalid JSX content model structures (negative cases)', () => {
    it('detects flow content inside Heading', () => {
      const code = `
import React from 'react';
import { Heading } from '@components/ui/typography';
import { VStack } from '@components/ui/stack';

export function InvalidHeading() {
  return (
    <Heading>
      <div>Invalid Block Element</div>
      <VStack>Invalid VStack</VStack>
    </Heading>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/InvalidHeading.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some(v => v.target === 'div')).toBe(true);
      expect(violations.some(v => v.target === 'VStack')).toBe(true);
    });

    it('detects flow content inside Label', () => {
      const code = `
import React from 'react';
import { Label } from '@components/ui/label';
import { VStack } from '@components/ui/stack';

export function InvalidLabel() {
  return (
    <Label>
      <VStack>Invalid Block Inside Label</VStack>
    </Label>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/InvalidLabel.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'VStack')).toBe(true);
    });

    it('detects nested interactive elements (Button inside Button)', () => {
      const code = `
import React from 'react';
import { Button } from '@components/ui/button';

export function NestedButtons() {
  return (
    <Button>
      <Button>Nested Button</Button>
    </Button>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/NestedButtons.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'Button')).toBe(true);
    });

    it('detects orphaned NativeOption outside NativeSelect', () => {
      const code = `
import React from 'react';
import { NativeOption } from '@components/ui/native-select';

export function OrphanOption() {
  return (
    <div>
      <NativeOption value="orphan">Orphan</NativeOption>
    </div>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/OrphanOption.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'NativeOption')).toBe(true);
    });

    it('detects non-text children inside NativeOption', () => {
      const code = `
import React from 'react';
import { NativeSelect, NativeOption } from '@components/ui/native-select';
import { Button } from '@components/ui/button';

export function InvalidOptionContent() {
  return (
    <NativeSelect>
      <NativeOption value="bad">
        <Button>Nested Button</Button>
      </NativeOption>
    </NativeSelect>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/InvalidOptionContent.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'Button')).toBe(true);
    });

    it('detects unsupported polymorphic as props', () => {
      const code = `
import React from 'react';
import { Button } from '@components/ui/button';
import { VStack } from '@components/ui/stack';

export function UnsupportedAs() {
  return (
    <div>
      <Button as="div">Click</Button>
      <VStack as="table">Content</VStack>
    </div>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/UnsupportedAs.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some(v => v.target === 'Button')).toBe(true);
      expect(violations.some(v => v.target === 'VStack')).toBe(true);
    });

    it('detects flow elements inside polymorphic phrasing containers (e.g. VStack as="span")', () => {
      const code = `
import React from 'react';
import { VStack } from '@components/ui/stack';

export function InvalidSpanNesting() {
  return (
    <VStack as="span">
      <div>Invalid Flow Div</div>
    </VStack>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/InvalidSpanNesting.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'div')).toBe(true);
    });

    it('detects non-list elements inside polymorphic list containers (e.g. VStack as="ul")', () => {
      const code = `
import React from 'react';
import { VStack } from '@components/ui/stack';

export function InvalidListNesting() {
  return (
    <VStack as="ul">
      <div>Invalid Div Inside List</div>
    </VStack>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/InvalidListNesting.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'div')).toBe(true);
    });

    it('detects <details> inside <span>', () => {
      const code = `
import React from 'react';

export function DetailsInSpan() {
  return (
    <span>
      <details>
        <summary>Summary</summary>
        <p>Content</p>
      </details>
    </span>
  );
}
`;
      const violations = rule.scanAst(code, 'features/example/DetailsInSpan.tsx');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.target === 'details')).toBe(true);
    });
  });

  describe('module graph check and allowlist support', () => {
    it('skips allowlisted files when checking graph nodes', () => {
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

      const violations = rule.check(mockGraph, {
        allowlist: ['features/legacy/LegacyView.tsx'],
      });

      expect(violations).toHaveLength(0);
    });

    it('skips components/ui/ primitives and test files automatically', () => {
      const mockGraph: ModuleGraph = {
        nodes: new Map([
          [
            'components/ui/button.tsx',
            {
              id: 'components/ui/button.tsx',
              absolutePath: 'mock/button.tsx',
              topLevelDir: 'components',
              imports: [],
            },
          ],
          [
            'features/test/example.test.tsx',
            {
              id: 'features/test/example.test.tsx',
              absolutePath: 'mock/example.test.tsx',
              topLevelDir: 'features',
              imports: [],
            },
          ],
          [
            'features/helper/util.ts',
            {
              id: 'features/helper/util.ts',
              absolutePath: 'mock/util.ts',
              topLevelDir: 'features',
              imports: [],
            },
          ],
        ]),
        adjacencyList: new Map(),
      };

      const violations = rule.check(mockGraph);
      expect(violations).toHaveLength(0);
    });
  });
});
