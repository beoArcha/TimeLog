// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CollapsibleCard from '@components/CollapsibleCard';
import { Settings } from 'lucide-react';
import { OxyContext } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: CollapsibleCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockState = getMockOxyFlowState();

  it('Given defaultExpanded = true, When rendered, Then it should show children and expand icon', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="My Card Title" icon={Settings} defaultExpanded={true}>
          <div>Card Content Body</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    expect(screen.getByText('My Card Title')).toBeTruthy();
    expect(screen.getByText('Card Content Body')).toBeTruthy();
  });

  it('Given defaultExpanded = false, When rendered, Then it should hide children initially', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="Collapsed Card" defaultExpanded={false}>
          <div>Hidden Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    expect(screen.queryByText('Hidden Content')).toBeNull();
  });

  it('Given card header clicked, When defaultExpanded is true, Then it should hide children', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="Toggable Card" defaultExpanded={true}>
          <div>Toggable Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    const header = screen.getByText('Toggable Card');
    fireEvent.click(header);

    expect(screen.queryByText('Toggable Content')).toBeNull();
  });

  it('Given headerRight element provided, When rendered, Then it should show headerRight', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="Header Right Card" headerRight={<span>Extra Info</span>}>
          <div>Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    expect(screen.getByText('Extra Info')).toBeTruthy();
  });

  it('Given titleNode prop provided, Then it should render titleNode instead of title text', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard titleNode={<span data-testid="custom-title">Custom Node</span>}>
          <div>Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    expect(screen.getByTestId('custom-title')).toBeTruthy();
    expect(screen.queryByText('Custom Node')).toBeTruthy();
  });

  it('Given onClick prop provided, When header clicked, Then it should call onClick', () => {
    const onClickSpy = vi.fn();
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="Clickable" onClick={onClickSpy}>
          <div>Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    const header = screen.getByRole('button');
    fireEvent.click(header);

    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('Given card is collapsed, When Enter key pressed on header, Then it should expand and show content', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="Keyboard Card" defaultExpanded={false}>
          <div>Keyboard Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    expect(screen.queryByText('Keyboard Content')).toBeNull();

    const header = screen.getByRole('button');
    fireEvent.keyDown(header, { key: 'Enter' });

    expect(screen.getByText('Keyboard Content')).toBeTruthy();
  });

  it('Given card is collapsed, When Space key pressed on header, Then it should expand and show content', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CollapsibleCard title="Space Card" defaultExpanded={false}>
          <div>Space Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    expect(screen.queryByText('Space Content')).toBeNull();

    const header = screen.getByRole('button');
    fireEvent.keyDown(header, { key: ' ' });

    expect(screen.getByText('Space Content')).toBeTruthy();
  });

  it('Given light theme, When rendered, Then it should apply light background classes', () => {
    const lightState = { ...mockState, resolvedTheme: 'light' as const };
    const { container } = render(
      <OxyContext.Provider value={lightState}>
        <CollapsibleCard title="Light Theme Card">
          <div>Light Content</div>
        </CollapsibleCard>
      </OxyContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-[#FCFAF7]');
  });
});
