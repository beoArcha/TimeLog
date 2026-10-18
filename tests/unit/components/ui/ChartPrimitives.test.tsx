// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { BarChart, Bar } from 'recharts';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltipContent,
  ChartLegendContent,
  useChart,
} from '@components/ui/chart';

describe('Unit Tests: ChartPrimitives', () => {
  afterEach(() => {
    cleanup();
  });

  const mockConfig: ChartConfig = {
    projectA: {
      label: 'Alpha Project',
      color: '#3b82f6',
    },
    projectB: {
      label: 'Beta Project',
      color: '#10b981',
    },
  };

  it('should render ChartContainer with data-slot and custom CSS variables', () => {
    // Arrange & Act
    const { container } = render(
      <ChartContainer config={mockConfig} className="custom-chart">
        <BarChart data={[{ name: 'Mon', projectA: 10 }]}>
          <Bar dataKey="projectA" />
        </BarChart>
      </ChartContainer>
    );

    // Assert
    const chartSlot = container.querySelector('[data-slot="chart"]');
    expect(chartSlot).not.toBeNull();
    expect(chartSlot?.className).toContain('custom-chart');

    const styleTag = container.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.innerHTML).toContain('--color-projectA: #3b82f6');
  });

  it('should throw error when useChart is accessed outside ChartContainer', () => {
    // Arrange
    const RogueComponent = () => {
      useChart();
      return <div>Rogue</div>;
    };

    // Act & Assert
    expect(() => render(<RogueComponent />)).toThrowError(
      'useChart must be used within a <ChartContainer />'
    );
  });

  it('should render ChartTooltipContent with active payload and indicators', () => {
    // Arrange
    const payload = [
      {
        name: 'projectA',
        dataKey: 'projectA',
        value: '02:00:00',
        color: '#3b82f6',
      },
    ];

    // Act
    render(
      <ChartContainer config={mockConfig}>
        <div>
          <ChartTooltipContent active={true} payload={payload} label="2026-06-15" />
        </div>
      </ChartContainer>
    );

    // Assert
    expect(screen.getByText('Alpha Project')).not.toBeNull();
    expect(screen.getByText('02:00:00')).not.toBeNull();
    expect(screen.getByText('2026-06-15')).not.toBeNull();
  });

  it('should render ChartLegendContent with items and color dots', () => {
    // Arrange
    const payload = [
      {
        value: 'projectA',
        dataKey: 'projectA',
        color: '#3b82f6',
      },
      {
        value: 'projectB',
        dataKey: 'projectB',
        color: '#10b981',
      },
    ];

    // Act
    render(
      <ChartContainer config={mockConfig}>
        <div>
          <ChartLegendContent payload={payload} />
        </div>
      </ChartContainer>
    );

    // Assert
    expect(screen.getByText('Alpha Project')).not.toBeNull();
    expect(screen.getByText('Beta Project')).not.toBeNull();
  });
});
