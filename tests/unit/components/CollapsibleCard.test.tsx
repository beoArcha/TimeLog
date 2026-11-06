// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import CollapsibleCard from '@components/CollapsibleCard';
import { Button } from '@components/ui/button';
import { Settings } from 'lucide-react';
import { getMockOXyFlowState } from '@tests/shared/test-helpers';

describe('CollapsibleCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockState = getMockOXyFlowState();

  it('should render the title and content when expanded by default', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="My Card Title" icon={Settings} defaultExpanded>
          <div>Card Content Body</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Act
    const trigger = screen.getByRole('button', { name: /My Card Title/ });

    // Assert
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Card Content Body')).toBeTruthy();
  });

  it('should report a collapsed state when defaultExpanded is false', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Collapsed Card" defaultExpanded={false}>
          <div>Hidden Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Act
    const trigger = screen.getByRole('button', { name: /Collapsed Card/ });

    // Assert
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Hidden Content')).toBeTruthy();
  });

  it('should collapse the content when the header trigger is activated', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Toggle Card" defaultExpanded>
          <div>Toggle Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: /Toggle Card/ }));

    // Assert
    expect(screen.getByRole('button', { name: /Toggle Card/ }).getAttribute('aria-expanded')).toBe('false');
  });

  it('should render the independent header action when headerRight is provided', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Header Right Card" headerRight={<span>Extra Info</span>}>
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Act
    const action = screen.getByText('Extra Info');

    // Assert
    expect(action).toBeTruthy();
  });

  it('should render titleNode instead of title when titleNode is provided', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard titleNode={<span data-testid="custom-title">Custom Node</span>}>
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Act
    const titleNode = screen.getByTestId('custom-title');

    // Assert
    expect(titleNode).toBeTruthy();
  });

  it('should invoke onClick when the header trigger changes the expanded state', () => {
    // Arrange
    const onClick = vi.fn();
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Clickable" onClick={onClick}>
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: /Clickable/ }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should expand the panel when Enter activates the header trigger', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Keyboard Card" defaultExpanded={false}>
          <div>Keyboard Content</div>
        </CollapsibleCard>
      </MockProviders>
    );
    const trigger = screen.getByRole('button', { name: /Keyboard Card/ });
    trigger.focus();

    // Act
    await user.keyboard('{Enter}');

    // Assert
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Keyboard Content')).toBeTruthy();
  });

  it('should expand the panel when Space activates the header trigger', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Space Card" defaultExpanded={false}>
          <div>Space Content</div>
        </CollapsibleCard>
      </MockProviders>
    );
    const trigger = screen.getByRole('button', { name: /Space Card/ });
    trigger.focus();

    // Act
    await user.keyboard('{Space}');

    // Assert
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Space Content')).toBeTruthy();
  });

  it('should preserve the expanded state when the independent header action is activated with Enter', async () => {
    // Arrange
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard
          title="Independent Action"
          headerRight={<Button onClick={onAction}>Header Action</Button>}
        >
          <div>Persistent Content</div>
        </CollapsibleCard>
      </MockProviders>
    );
    const action = screen.getByRole('button', { name: 'Header Action' });
    action.focus();

    // Act
    await user.keyboard('{Enter}');

    // Assert
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Independent Action/ }).getAttribute('aria-expanded')).toBe('true');
  });

  it('should preserve the expanded state when the independent header action is activated with Space', async () => {
    // Arrange
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard
          title="Independent Action"
          headerRight={<Button onClick={onAction}>Header Action</Button>}
        >
          <div>Persistent Content</div>
        </CollapsibleCard>
      </MockProviders>
    );
    const action = screen.getByRole('button', { name: 'Header Action' });
    action.focus();

    // Act
    await user.keyboard('{Space}');

    // Assert
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Independent Action/ }).getAttribute('aria-expanded')).toBe('true');
  });

  it('should assign unique control relationships when multiple cards are rendered', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="First Card"><div>First Content</div></CollapsibleCard>
        <CollapsibleCard title="Second Card"><div>Second Content</div></CollapsibleCard>
      </MockProviders>
    );

    // Act
    const triggers = [
      screen.getByRole('button', { name: /First Card/ }),
      screen.getByRole('button', { name: /Second Card/ }),
    ];
    const controlIds = triggers.map((trigger) => trigger.getAttribute('aria-controls'));

    // Assert
    expect(controlIds.every(Boolean)).toBe(true);
    expect(new Set(controlIds).size).toBe(2);
  });

  it('Given forceMountOnPrint = true and collapsed, When rendered, Then content remains mounted in DOM with hidden print:flex', () => {
    const { container } = render(
      <MockProviders state={mockState}>
        <CollapsibleCard
          title="Printable Card"
          defaultExpanded={false}
          forceMountOnPrint={true}
          headerTestId="printable-card-header"
        >
          <div data-testid="printable-content">Always Mounted Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    // Node is present in DOM for print media queries
    const content = screen.getByTestId('printable-content');
    expect(content).toBeTruthy();

    // But wrapped in a container that has hidden print:flex for screen vs print
    const contentWrapper = container.querySelector('#collapsible-content-printable-card-header');
    expect(contentWrapper).not.toBeNull();
    expect(contentWrapper?.classList.contains('hidden')).toBe(true);
    expect(contentWrapper?.className).toContain('print:flex');

    // Chevron wrapper is print:hidden
    const chevronWrapper = container.querySelector('.print\\:hidden');
    expect(chevronWrapper).not.toBeNull();
  });

  it('Given forceMountOnPrint = true, When header is clicked, Then content expands and loses hidden class', () => {
    const { container } = render(
      <MockProviders state={mockState}>
        <CollapsibleCard
          title="Printable Toggle"
          defaultExpanded={false}
          forceMountOnPrint={true}
          headerTestId="toggle-header"
        >
          <div>Toggled Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    const header = screen.getByRole('button');
    const contentWrapper = container.querySelector('#collapsible-content-toggle-header');
    expect(contentWrapper?.classList.contains('hidden')).toBe(true);

    fireEvent.click(header);
    expect(contentWrapper?.classList.contains('hidden')).toBe(false);
  });
});

