import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CollapsibleCard from '@components/CollapsibleCard';
import { Button } from '@components/ui/button';
import { Settings } from 'lucide-react';
import { getMockOXyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: CollapsibleCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockState = getMockOXyFlowState();

  it('Given defaultExpanded = true, When rendered, Then it should show children and expand icon', () => {
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="My Card Title" icon={Settings} defaultExpanded={true}>
          <div>Card Content Body</div>
        </CollapsibleCard>
      </MockProviders>
    );

    expect(screen.getByText('My Card Title')).toBeTruthy();
    expect(screen.getByText('Card Content Body')).toBeTruthy();
  });

  it('Given defaultExpanded = false, When rendered, Then it should hide children initially', () => {
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Collapsed Card" defaultExpanded={false}>
          <div>Hidden Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    expect(screen.getByText('Hidden Content').closest('[hidden]')).toBeTruthy();
  });

  it('Given card header clicked, When defaultExpanded is true, Then it should hide children', () => {
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Toggable Card" defaultExpanded={true}>
          <div>Toggable Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    fireEvent.click(screen.getByRole('button', { name: /Toggable Card/ }));

    expect(screen.getByText('Toggable Content').closest('[hidden]')).toBeTruthy();
  });

  it('Given headerRight element provided, When rendered, Then it should show headerRight', () => {
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Header Right Card" headerRight={<span>Extra Info</span>}>
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    expect(screen.getByText('Extra Info')).toBeTruthy();
  });

  it('Given titleNode prop provided, Then it should render titleNode instead of title text', () => {
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard titleNode={<span data-testid="custom-title">Custom Node</span>}>
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    expect(screen.getByTestId('custom-title')).toBeTruthy();
    expect(screen.queryByText('Custom Node')).toBeTruthy();
  });

  it('Given onClick prop provided, When header clicked, Then it should call onClick', () => {
    const onClickSpy = vi.fn();
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Clickable" onClick={onClickSpy}>
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    fireEvent.click(screen.getByRole('button', { name: /Clickable/ }));

    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('Given card is collapsed, When Enter key activates the header, Then it should expand and show content', async () => {
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
    await user.keyboard('{Enter}');

    expect(screen.getByText('Keyboard Content').closest('[hidden]')).toBeNull();
  });

  it('Given card is collapsed, When Space key activates the header, Then it should expand and show content', async () => {
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
    await user.keyboard('{Space}');

    expect(screen.getByText('Space Content').closest('[hidden]')).toBeNull();
  });

  it('Given an interactive headerRight action, When Enter or Space is pressed, Then the card should remain expanded', async () => {
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
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Persistent Content').closest('[hidden]')).toBeNull();

    await user.keyboard(' ');
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Persistent Content').closest('[hidden]')).toBeNull();
  });

  it('Given multiple cards are rendered, Then each trigger should control a unique content region', () => {
    render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="First Card"><div>First Content</div></CollapsibleCard>
        <CollapsibleCard title="Second Card"><div>Second Content</div></CollapsibleCard>
      </MockProviders>
    );

    const triggers = [
      screen.getByRole('button', { name: /First Card/ }),
      screen.getByRole('button', { name: /Second Card/ }),
    ];
    const contentIds = triggers.map((trigger) => trigger.getAttribute('aria-controls'));

    expect(new Set(contentIds).size).toBe(2);
    contentIds.forEach((id) => {
      expect(id).toBeTruthy();
      expect(document.getElementById(id!)).toBeTruthy();
    });
  });

  it('Given CollapsibleCard rendered, Then it should consume semantic design tokens', () => {
    const { container } = render(
      <MockProviders state={mockState}>
        <CollapsibleCard title="Semantic Card">
          <div>Content</div>
        </CollapsibleCard>
      </MockProviders>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-card');
    expect(wrapper.className).toContain('border-border');
  });
});
