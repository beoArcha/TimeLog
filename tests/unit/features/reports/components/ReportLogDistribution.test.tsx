import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportLogDistribution } from '@features/reports/components/ReportLogDistribution';
import { ProjectChartItem } from '@features/reports/types';

describe('Unit Tests: ReportLogDistribution', () => {
  const sampleProjectChart: ProjectChartItem[] = [
    {
      id: 'p1',
      name: 'Alpha Project',
      color: 'indigo',
      seconds: 3600,
      tasks: [
        {
          task: { id: 't1', projectId: 'p1', name: 'UI Task', completed: false, createdAt: '2026-06-15' },
          seconds: 3600,
        },
      ],
    },
    {
      id: 'p2',
      name: 'Custom Hex Project',
      color: '#12abef',
      seconds: 1800,
      tasks: [],
    },
  ];

  it('Given projectChart, When rendered, Then displays project titles, progress bars, and formatted times', () => {
    // Arrange & Act
    render(
      <ReportLogDistribution
        projectChart={sampleProjectChart}
        maxSec={3600}
      />
    );

    // Assert
    expect(screen.getByText('Alpha Project')).not.toBeNull();
    expect(screen.getByText('Custom Hex Project')).not.toBeNull();
    expect(screen.getAllByText('01:00:00').length).toBe(2);
    expect(screen.getByText('00:30:00')).not.toBeNull();
    expect(screen.getByText('UI Task')).not.toBeNull();
  });

  it('Given palette and hex colors, When rendered, Then resolves project dot styling safely without dynamic class purge issues', () => {
    // Arrange & Act
    const { container } = render(
      <ReportLogDistribution
        projectChart={sampleProjectChart}
        maxSec={3600}
      />
    );

    // Assert
    // Check palette dot
    const dots = container.querySelectorAll('span[aria-hidden="true"].rounded-full');
    expect(dots.length).toBe(2);

    // Palette dot uses bg-indigo-500 class
    expect(dots[0].className).toContain('bg-indigo-500');

    // Hex dot uses inline backgroundColor style
    expect((dots[1] as HTMLElement).style.backgroundColor).toBe('rgb(18, 171, 239)');
  });
});
