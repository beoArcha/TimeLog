// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CollapsibleCard from '../../../src/components/CollapsibleCard';
import { Settings } from 'lucide-react';
import { OxyContext } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '../../shared/test-helpers';

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
});
