import { describe, expect, it } from 'vitest';
import {
  COMPONENT_REGISTRY,
  ContentCategory,
  ComponentCategory,
  HTML_ELEMENT_CATEGORY_MAP,
  getComponentMetadata,
  getEffectiveContentCategory,
  getNativeHtmlElementCategory,
  getHtmlElementConstraints,
  isDesignSystemComponent,
  getContextRestrictedParents,
  getHtmlElementDefinition,
  getNativeHtmlElementCategories,
  isNativeInteractiveElement,
  isNativeMetadataElement,
} from '../registry/component-registry';

const VALID_CONTENT_CATEGORIES: ContentCategory[] = [
  'flow',
  'phrasing',
  'heading',
  'sectioning',
  'interactive',
  'embedded',
  'table-structure',
  'form-option',
  'transparent',
  'text',
  'metadata',
];

const VALID_COMPONENT_CATEGORIES: ComponentCategory[] = [
  'layout',
  'typography',
  'inline',
  'form',
  'surface',
  'table',
  'feedback',
  'interactive',
];

describe('Component Registry Consistency', () => {
  it('contains registered design system components', () => {
    expect(Object.keys(COMPONENT_REGISTRY).length).toBeGreaterThan(0);
  });

  describe('every component metadata entry', () => {
    for (const [key, meta] of Object.entries(COMPONENT_REGISTRY)) {
      describe(`Component: ${key}`, () => {
        it('matches registry key name', () => {
          expect(meta.name).toBe(key);
        });

        it('has a valid component category', () => {
          expect(VALID_COMPONENT_CATEGORIES).toContain(meta.category);
        });

        it('has a valid, non-empty defaultTag in lowercase', () => {
          expect(meta.defaultTag).toBeDefined();
          expect(typeof meta.defaultTag).toBe('string');
          expect(meta.defaultTag.length).toBeGreaterThan(0);
          expect(meta.defaultTag).toBe(meta.defaultTag.toLowerCase());
        });

        it('has a valid selfCategory', () => {
          expect(VALID_CONTENT_CATEGORIES).toContain(meta.selfCategory);
        });

        it('has valid allowedChildCategories', () => {
          expect(Array.isArray(meta.allowedChildCategories)).toBe(true);
          for (const childCat of meta.allowedChildCategories) {
            expect(VALID_CONTENT_CATEGORIES).toContain(childCat);
          }
        });

        if (meta.supportedAs) {
          it('supportedAs is an array of non-empty tags and includes defaultTag', () => {
            expect(Array.isArray(meta.supportedAs)).toBe(true);
            expect(meta.supportedAs.length).toBeGreaterThan(0);
            for (const asTag of meta.supportedAs) {
              expect(typeof asTag).toBe('string');
              expect(asTag.length).toBeGreaterThan(0);
            }
            expect(meta.supportedAs).toContain(meta.defaultTag);
          });
        }

        it('has no contradictions between defaultTag and selfCategory', () => {
          const expectedCategory = HTML_ELEMENT_CATEGORY_MAP[meta.defaultTag];
          if (expectedCategory) {
            expect(
              meta.selfCategory,
              `Component <${meta.name}> renders default tag <${meta.defaultTag}> but declared contradictory selfCategory '${meta.selfCategory}' instead of '${expectedCategory}'`
            ).toBe(expectedCategory);
          }
        });

        if (meta.allowedChildTags && meta.forbiddenChildTags) {
          it('has no overlapping allowed and forbidden child tags', () => {
            const forbiddenSet = new Set(meta.forbiddenChildTags);
            for (const allowedTag of meta.allowedChildTags!) {
              expect(forbiddenSet.has(allowedTag)).toBe(false);
            }
          });
        }
      });
    }
  });

  describe('Badge semantic and category consistency', () => {
    it('declares selfCategory as flow matching its defaultTag div', () => {
      const badge = COMPONENT_REGISTRY.Badge;
      expect(badge.defaultTag).toBe('div');
      expect(badge.selfCategory).toBe('flow');
    });

    it('becomes phrasing only when polymorphic as="span" is applied', () => {
      const badge = COMPONENT_REGISTRY.Badge;
      expect(getEffectiveContentCategory(badge)).toBe('flow');
      expect(getEffectiveContentCategory(badge, 'div')).toBe('flow');
      expect(getEffectiveContentCategory(badge, 'span')).toBe('phrasing');
    });
  });

  describe('InlineCluster semantic and category consistency', () => {
    it('declares selfCategory as flow matching its defaultTag div', () => {
      const cluster = COMPONENT_REGISTRY.InlineCluster;
      expect(cluster.defaultTag).toBe('div');
      expect(cluster.selfCategory).toBe('flow');
    });

    it('becomes phrasing when polymorphic as="span" is applied', () => {
      const cluster = COMPONENT_REGISTRY.InlineCluster;
      expect(getEffectiveContentCategory(cluster)).toBe('flow');
      expect(getEffectiveContentCategory(cluster, 'div')).toBe('flow');
      expect(getEffectiveContentCategory(cluster, 'span')).toBe('phrasing');
    });
  });

  describe('HStack and VStack semantic and category consistency', () => {
    it('declares selfCategory as flow matching their defaultTag div', () => {
      expect(COMPONENT_REGISTRY.HStack.defaultTag).toBe('div');
      expect(COMPONENT_REGISTRY.HStack.selfCategory).toBe('flow');
      expect(COMPONENT_REGISTRY.VStack.defaultTag).toBe('div');
      expect(COMPONENT_REGISTRY.VStack.selfCategory).toBe('flow');
    });

    it('becomes phrasing when polymorphic as="span" is applied', () => {
      const hstack = COMPONENT_REGISTRY.HStack;
      const vstack = COMPONENT_REGISTRY.VStack;
      expect(getEffectiveContentCategory(hstack)).toBe('flow');
      expect(getEffectiveContentCategory(hstack, 'div')).toBe('flow');
      expect(getEffectiveContentCategory(hstack, 'span')).toBe('phrasing');

      expect(getEffectiveContentCategory(vstack)).toBe('flow');
      expect(getEffectiveContentCategory(vstack, 'div')).toBe('flow');
      expect(getEffectiveContentCategory(vstack, 'span')).toBe('phrasing');
    });
  });

  describe('Typography components supportedAs metadata consistency', () => {
    it('declares valid supportedAs for Overline, MonoText, and MetricText', () => {
      expect(COMPONENT_REGISTRY.Overline.supportedAs).toContain('span');
      expect(COMPONENT_REGISTRY.Overline.supportedAs).toContain('p');
      expect(COMPONENT_REGISTRY.Overline.supportedAs).toContain('h4');

      expect(COMPONENT_REGISTRY.MonoText.supportedAs).toContain('span');
      expect(COMPONENT_REGISTRY.MonoText.supportedAs).toContain('p');

      expect(COMPONENT_REGISTRY.MetricText.supportedAs).toContain('span');
      expect(COMPONENT_REGISTRY.MetricText.supportedAs).toContain('p');
    });

    it('computes effective content category for polymorphic typography components', () => {
      const overline = COMPONENT_REGISTRY.Overline;
      expect(getEffectiveContentCategory(overline)).toBe('phrasing');
      expect(getEffectiveContentCategory(overline, 'span')).toBe('phrasing');
      expect(getEffectiveContentCategory(overline, 'p')).toBe('flow');
      expect(getEffectiveContentCategory(overline, 'h4')).toBe('heading');
    });
  });

  describe('Grid layout metadata consistency', () => {
    it('declares selfCategory as flow matching its defaultTag div', () => {
      const grid = COMPONENT_REGISTRY.Grid;
      expect(grid.defaultTag).toBe('div');
      expect(grid.selfCategory).toBe('flow');
    });

    it('contains exactly div, section, and article in supportedAs and does not allow ul or ol', () => {
      const grid = COMPONENT_REGISTRY.Grid;
      expect(grid.supportedAs).toEqual(['div', 'section', 'article']);
      expect(grid.supportedAs).not.toContain('ul');
      expect(grid.supportedAs).not.toContain('ol');
    });
  });

  describe('NativeOption and NativeOptGroup form metadata consistency', () => {
    it('registers NativeOption and NativeOptGroup in form category with selfCategory form-option', () => {
      const optionMeta = COMPONENT_REGISTRY.NativeOption;
      expect(optionMeta).toBeDefined();
      expect(optionMeta.category).toBe('form');
      expect(optionMeta.defaultTag).toBe('option');
      expect(optionMeta.selfCategory).toBe('form-option');
      expect(optionMeta.allowedChildCategories).toEqual(['text']);
      expect(optionMeta.forbiddenChildTags).toBeUndefined();

      const optGroupMeta = COMPONENT_REGISTRY.NativeOptGroup;
      expect(optGroupMeta).toBeDefined();
      expect(optGroupMeta.category).toBe('form');
      expect(optGroupMeta.defaultTag).toBe('optgroup');
      expect(optGroupMeta.selfCategory).toBe('form-option');
      expect(optGroupMeta.allowedChildCategories).toEqual(['form-option', 'transparent']);
      expect(optGroupMeta.allowedChildTags).toEqual(['option', 'NativeOption']);
    });

    it('verifies NativeSelect only permits form-option components as children', () => {
      const selectMeta = COMPONENT_REGISTRY.NativeSelect;
      expect(selectMeta.allowedChildCategories).toContain('form-option');
      expect(selectMeta.allowedChildTags).toContain('NativeOption');
      expect(selectMeta.allowedChildTags).toContain('NativeOptGroup');
    });
  });

  describe('helper functions', () => {
    it('getComponentMetadata returns metadata for registered components', () => {
      expect(getComponentMetadata('VStack')).toBeDefined();
      expect(getComponentMetadata('Button')?.defaultTag).toBe('button');
      expect(getComponentMetadata('NativeOption')?.defaultTag).toBe('option');
      expect(getComponentMetadata('NativeOptGroup')?.defaultTag).toBe('optgroup');
      expect(getComponentMetadata('NonExistent')).toBeUndefined();
    });

    it('isDesignSystemComponent correctly identifies members', () => {
      expect(isDesignSystemComponent('VStack')).toBe(true);
      expect(isDesignSystemComponent('Badge')).toBe(true);
      expect(isDesignSystemComponent('NativeOption')).toBe(true);
      expect(isDesignSystemComponent('NativeOptGroup')).toBe(true);
      expect(isDesignSystemComponent('div')).toBe(false);
      expect(isDesignSystemComponent('CustomWidget')).toBe(false);
    });

    it('getEffectiveContentCategory returns undefined when asProp is dynamic', () => {
      const textMeta = COMPONENT_REGISTRY.Text;
      const badgeMeta = COMPONENT_REGISTRY.Badge;
      const vstackMeta = COMPONENT_REGISTRY.VStack;

      expect(getEffectiveContentCategory(textMeta, 'dynamic')).toBeUndefined();
      expect(getEffectiveContentCategory(badgeMeta, 'dynamic')).toBeUndefined();
      expect(getEffectiveContentCategory(vstackMeta, 'dynamic')).toBeUndefined();
    });

    it('getNativeHtmlElementCategory classifies standard and expanded native HTML elements', () => {
      // Flow content
      expect(getNativeHtmlElementCategory('div')).toBe('flow');
      expect(getNativeHtmlElementCategory('menu')).toBe('flow');
      expect(getNativeHtmlElementCategory('dialog')).toBe('flow');
      expect(getNativeHtmlElementCategory('search')).toBe('flow');

      // Phrasing content
      expect(getNativeHtmlElementCategory('span')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('data')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('dfn')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('output')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('progress')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('meter')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('ruby')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('rt')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('rp')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('datalist')).toBe('phrasing');

      // Embedded content
      expect(getNativeHtmlElementCategory('source')).toBe('embedded');
      expect(getNativeHtmlElementCategory('track')).toBe('embedded');
      expect(getNativeHtmlElementCategory('math')).toBe('embedded');

      // Transparent
      expect(getNativeHtmlElementCategory('template')).toBe('transparent');
      expect(getNativeHtmlElementCategory('slot')).toBe('transparent');

      // Other representative categories
      expect(getNativeHtmlElementCategory('a')).toBe('interactive');
      expect(getNativeHtmlElementCategory('button')).toBe('interactive');
      expect(getNativeHtmlElementCategory('input')).toBe('interactive');
      expect(getNativeHtmlElementCategory('h1')).toBe('heading');
      expect(getNativeHtmlElementCategory('section')).toBe('sectioning');
      expect(getNativeHtmlElementCategory('option')).toBe('form-option');
      expect(getNativeHtmlElementCategory('tr')).toBe('table-structure');
      expect(getNativeHtmlElementCategory('custom-unknown-element')).toBeUndefined();
    });

    it('getHtmlElementConstraints returns structural constraints for list containers and phrasing elements', () => {
      const ulConstraints = getHtmlElementConstraints('ul');
      expect(ulConstraints).toBeDefined();
      expect(ulConstraints?.allowedChildTags).toEqual(['li', 'ListItem']);

      const olConstraints = getHtmlElementConstraints('ol');
      expect(olConstraints).toBeDefined();
      expect(olConstraints?.allowedChildTags).toEqual(['li', 'ListItem']);

      const menuConstraints = getHtmlElementConstraints('menu');
      expect(menuConstraints).toBeDefined();
      expect(menuConstraints?.allowedChildTags).toEqual(['li', 'ListItem']);

      const spanConstraints = getHtmlElementConstraints('span');
      expect(spanConstraints).toBeDefined();
      expect(spanConstraints?.allowedChildCategories).toContain('phrasing');
      expect(spanConstraints?.forbiddenChildTags).toContain('div');
      expect(spanConstraints?.forbiddenChildTags).toContain('VStack');

      const pConstraints = getHtmlElementConstraints('p');
      expect(pConstraints).toBeDefined();
      expect(pConstraints?.allowedChildCategories).toContain('phrasing');
      expect(pConstraints?.forbiddenChildTags).toContain('div');
      expect(pConstraints?.forbiddenChildTags).toContain('VStack');

      expect(getHtmlElementConstraints('div')).toBeUndefined();
      expect(getHtmlElementConstraints('unknown-element')).toBeUndefined();
    });

    it('registers List and ListItem components with correct metadata', () => {
      const listMeta = COMPONENT_REGISTRY.List;
      expect(listMeta).toBeDefined();
      expect(listMeta.defaultTag).toBe('ul');
      expect(listMeta.supportedAs).toEqual(['ul', 'ol']);
      expect(listMeta.selfCategory).toBe('flow');
      expect(listMeta.allowedChildTags).toEqual(['li', 'ListItem']);

      const listItemMeta = COMPONENT_REGISTRY.ListItem;
      expect(listItemMeta).toBeDefined();
      expect(listItemMeta.defaultTag).toBe('li');
      expect(listItemMeta.supportedAs).toEqual(['li']);
      expect(listItemMeta.selfCategory).toBe('flow');
    });

    it('correctly classifies details, legend, summary, area, map, and metadata elements', () => {
      // details: flow + interactive, not phrasing
      expect(getNativeHtmlElementCategory('details')).toBe('flow');
      expect(getNativeHtmlElementCategories('details')).toContain('flow');
      expect(getNativeHtmlElementCategories('details')).toContain('interactive');
      expect(getNativeHtmlElementCategories('details')).not.toContain('phrasing');
      expect(isNativeInteractiveElement('details')).toBe(true);

      // legend: phrasing, context restricted to fieldset
      expect(getNativeHtmlElementCategory('legend')).toBe('phrasing');
      expect(getNativeHtmlElementCategories('legend')).toEqual(['phrasing']);
      expect(getContextRestrictedParents('legend')).toEqual(['fieldset']);

      // summary: phrasing, context restricted to details
      expect(getNativeHtmlElementCategory('summary')).toBe('phrasing');
      expect(getNativeHtmlElementCategories('summary')).toEqual(['phrasing']);
      expect(getContextRestrictedParents('summary')).toEqual(['details']);

      // area: phrasing, context restricted to map
      expect(getNativeHtmlElementCategory('area')).toBe('phrasing');
      expect(getNativeHtmlElementCategories('area')).toEqual(['phrasing']);
      expect(getContextRestrictedParents('area')).toEqual(['map']);

      // map: phrasing
      expect(getNativeHtmlElementCategory('map')).toBe('phrasing');
      expect(getNativeHtmlElementCategories('map')).toContain('phrasing');
      expect(getNativeHtmlElementCategories('map')).toContain('flow');

      // metadata elements
      expect(getNativeHtmlElementCategory('title')).toBe('metadata');
      expect(getNativeHtmlElementCategory('base')).toBe('metadata');
      expect(getNativeHtmlElementCategory('meta')).toBe('metadata');
      expect(getNativeHtmlElementCategory('link')).toBe('metadata');
      expect(getNativeHtmlElementCategory('style')).toBe('metadata');
      expect(getNativeHtmlElementCategory('head')).toBe('metadata');
      expect(isNativeMetadataElement('title')).toBe(true);
      expect(isNativeMetadataElement('meta')).toBe(true);
      expect(getContextRestrictedParents('title')).toEqual(['head']);
      expect(getContextRestrictedParents('meta')).toEqual(['head']);

      // html and body
      expect(getNativeHtmlElementCategory('html')).toBe('flow');
      expect(getNativeHtmlElementCategory('body')).toBe('flow');
      expect(getContextRestrictedParents('html')).toEqual([]);
      expect(getContextRestrictedParents('body')).toEqual(['html']);
      expect(getContextRestrictedParents('head')).toEqual(['html']);

      // script and noscript
      expect(getNativeHtmlElementCategory('script')).toBe('phrasing');
      expect(getNativeHtmlElementCategories('script')).toEqual(['metadata', 'flow', 'phrasing']);
      expect(getNativeHtmlElementCategory('noscript')).toBe('phrasing');
      expect(getNativeHtmlElementCategories('noscript')).toEqual(['metadata', 'flow', 'phrasing']);
    });

    it('returns element definitions via getHtmlElementDefinition', () => {
      const detailsDef = getHtmlElementDefinition('details');
      expect(detailsDef).toBeDefined();
      expect(detailsDef?.tag).toBe('details');
      expect(detailsDef?.category).toBe('flow');
      expect(detailsDef?.isInteractive).toBe(true);

      const legendDef = getHtmlElementDefinition('legend');
      expect(legendDef).toBeDefined();
      expect(legendDef?.category).toBe('phrasing');
      expect(legendDef?.allowedParents).toEqual(['fieldset']);
    });
  });
});
