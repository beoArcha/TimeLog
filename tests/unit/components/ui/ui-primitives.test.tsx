// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Button } from '../../../../src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../src/components/ui/card';
import { Input } from '../../../../src/components/ui/input';
import { Skeleton, StatsSkeleton, TableSkeleton } from '../../../../src/components/ui/Skeletons';
import { OxyContext } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '../../../shared/test-helpers';

describe('Unit Tests: UI Primitives', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Button Primitive', () => {
    it('should render button with text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeTruthy();
    });

    it('should support disabled state', () => {
      render(<Button disabled>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe('Card Components', () => {
    it('should render Card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>My Title</CardTitle>
          </CardHeader>
          <CardContent>Content Area</CardContent>
        </Card>
      );
      expect(screen.getByText('My Title')).toBeTruthy();
      expect(screen.getByText('Content Area')).toBeTruthy();
    });
  });

  describe('Input Component', () => {
    it('should render text input', () => {
      render(<Input type="text" placeholder="Enter name" />);
      expect(screen.getByPlaceholderText('Enter name')).toBeTruthy();
    });
  });

  describe('Skeletons', () => {
    it('should render Skeleton components', () => {
      const mockState = getMockOxyFlowState();
      render(
        <OxyContext.Provider value={mockState}>
          <Skeleton className="custom-class" />
          <StatsSkeleton />
          <TableSkeleton rows={2} />
        </OxyContext.Provider>
      );
      const skeleton = document.querySelector('.custom-class');
      expect(skeleton).toBeTruthy();
    });
  });
});
