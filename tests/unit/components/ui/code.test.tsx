// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Code } from '@components/ui/code';
import { CodeBlock } from '@components/CodeBlock';

describe('Code', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render inline code element by default when block is false', () => {
    // Arrange & Act
    const { container } = render(<Code>const x = 1;</Code>);

    // Assert
    const element = container.querySelector('[data-slot="code-inline"]');
    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('code');
    expect(screen.getByText('const x = 1;')).toBeTruthy();
  });

  it('should render preformatted block element when block prop is true', () => {
    // Arrange & Act
    const { container } = render(<Code block>npm run test</Code>);

    // Assert
    const pre = container.querySelector('[data-slot="code-block"]');
    expect(pre).toBeTruthy();
    expect(pre?.tagName.toLowerCase()).toBe('pre');
    expect(pre?.querySelector('code')).toBeTruthy();
  });

  it('should forward ref to pre element when rendered as block', () => {
    // Arrange
    const ref = React.createRef<HTMLElement>();

    // Act
    render(<Code ref={ref} block>bun install</Code>);

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLPreElement);
  });
});

describe('CodeBlock', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render pre element by default when inline is false', () => {
    // Arrange & Act
    const { container } = render(<CodeBlock>cargo test</CodeBlock>);

    // Assert
    const pre = container.querySelector('[data-slot="code-block"]');
    expect(pre).toBeTruthy();
    expect(screen.getByText('cargo test')).toBeTruthy();
  });

  it('should render inline code element when inline is true', () => {
    // Arrange & Act
    const { container } = render(<CodeBlock inline>git status</CodeBlock>);

    // Assert
    const inline = container.querySelector('[data-slot="code-inline"]');
    expect(inline).toBeTruthy();
    expect(screen.getByText('git status')).toBeTruthy();
  });
});
