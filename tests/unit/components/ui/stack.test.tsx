// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Stack, HStack, VStack, InlineCluster } from '@components/ui/stack';

describe('Unit Tests: Stack Primitives', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Stack Base Primitive', () => {
    it('should render default stack as horizontal flex div', () => {
      // Arrange & Act
      const { container } = render(<Stack><span>Item 1</span><span>Item 2</span></Stack>);

      // Assert
      const element = container.querySelector('[data-slot="stack"]');
      expect(element).toBeTruthy();
      expect(element?.tagName.toLowerCase()).toBe('div');
      expect(element?.className).toContain('flex');
      expect(element?.className).toContain('flex-row');
    });

    it('should render custom polymorphic element when as prop is provided', () => {
      // Arrange & Act
      const { container } = render(<Stack as="section"><span>Section Item</span></Stack>);

      // Assert
      const element = container.querySelector('section[data-slot="stack"]');
      expect(element).toBeTruthy();
      expect(element?.tagName.toLowerCase()).toBe('section');
    });

    it('should forward ref to the underlying element', () => {
      // Arrange
      const ref = React.createRef<HTMLDivElement>();

      // Act
      render(<Stack ref={ref}>Ref Content</Stack>);

      // Assert
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('HStack Primitive', () => {
    it('should render horizontal row with items-center by default', () => {
      // Arrange & Act
      const { container } = render(
        <HStack gap="md" justify="between">
          <span>Left</span>
          <span>Right</span>
        </HStack>
      );

      // Assert
      const element = container.querySelector('[data-slot="hstack"]');
      expect(element).toBeTruthy();
      expect(element?.className).toContain('flex-row');
      expect(element?.className).toContain('items-center');
      expect(element?.className).toContain('justify-between');
      expect(element?.className).toContain('gap-3');
    });

    it('should support polymorphic as span with custom alignment', () => {
      // Arrange & Act
      const { container } = render(
        <HStack as="span" align="start" gap="xs">
          <span>A</span>
          <span>B</span>
        </HStack>
      );

      // Assert
      const element = container.querySelector('span[data-slot="hstack"]');
      expect(element).toBeTruthy();
      expect(element?.tagName.toLowerCase()).toBe('span');
      expect(element?.className).toContain('items-start');
      expect(element?.className).toContain('gap-1.5');
    });
  });

  describe('VStack Primitive', () => {
    it('should render vertical column with items-stretch by default', () => {
      // Arrange & Act
      const { container } = render(
        <VStack gap="lg">
          <div>Top</div>
          <div>Bottom</div>
        </VStack>
      );

      // Assert
      const element = container.querySelector('[data-slot="vstack"]');
      expect(element).toBeTruthy();
      expect(element?.className).toContain('flex-col');
      expect(element?.className).toContain('items-stretch');
      expect(element?.className).toContain('gap-4');
    });

    it('should support custom alignment and justify props', () => {
      // Arrange & Act
      const { container } = render(
        <VStack align="center" justify="center" gap="sm">
          <div>Centered</div>
        </VStack>
      );

      // Assert
      const element = container.querySelector('[data-slot="vstack"]');
      expect(element).toBeTruthy();
      expect(element?.className).toContain('items-center');
      expect(element?.className).toContain('justify-center');
      expect(element?.className).toContain('gap-2');
    });
  });

  describe('InlineCluster Primitive', () => {
    it('should render inline-flex container with flex-wrap enabled by default', () => {
      // Arrange & Act
      const { container } = render(
        <InlineCluster gap="2xs">
          <span>Badge 1</span>
          <span>Badge 2</span>
        </InlineCluster>
      );

      // Assert
      const element = container.querySelector('[data-slot="inline-cluster"]');
      expect(element).toBeTruthy();
      expect(element?.className).toContain('inline-flex');
      expect(element?.className).toContain('flex-wrap');
      expect(element?.className).toContain('items-center');
      expect(element?.className).toContain('gap-1');
    });
  });
});
