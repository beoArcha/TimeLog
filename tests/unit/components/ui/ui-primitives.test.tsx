import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Button } from '@components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Skeleton, StatsSkeleton, TableSkeleton } from '@components/ui/Skeletons';
import { Checkbox } from '@components/ui/checkbox';
import { Badge } from '@components/ui/badge';
import { Separator } from '@components/ui/separator';
import { Heading, Text } from '@components/ui/typography';
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/table';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

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
        <MockProviders state={mockState}>
          <Skeleton className="custom-class" />
          <StatsSkeleton />
          <TableSkeleton rows={2} />
        </MockProviders>
      );
      const skeleton = document.querySelector('.custom-class');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Checkbox Primitive', () => {
    it('should render Checkbox primitive', () => {
      render(<Checkbox aria-label="Accept terms" />);
      expect(screen.getByRole('checkbox', { name: /accept terms/i })).toBeTruthy();
    });
  });

  describe('Badge Primitive', () => {
    it('should render Badge with variant text', () => {
      render(<Badge variant="success">Completed</Badge>);
      expect(screen.getByText('Completed')).toBeTruthy();
    });
  });

  describe('Separator Primitive', () => {
    it('should render Separator', () => {
      render(<Separator data-testid="sep" />);
      expect(screen.getByTestId('sep')).toBeTruthy();
    });
  });

  describe('Typography Primitives', () => {
    it('should render Heading and Text', () => {
      render(
        <div>
          <Heading level={1}>Main Header</Heading>
          <Text variant="muted">Subtext detail</Text>
        </div>
      );
      expect(screen.getByRole('heading', { level: 1, name: /main header/i })).toBeTruthy();
      expect(screen.getByText('Subtext detail')).toBeTruthy();
    });
  });

  describe('Alert Primitive', () => {
    it('should render Alert with title and description', () => {
      render(
        <Alert variant="warning">
          <AlertTitle>Warning Title</AlertTitle>
          <AlertDescription>Warning description</AlertDescription>
        </Alert>
      );
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Warning Title')).toBeTruthy();
    });
  });

  describe('Table Primitives', () => {
    it('should render Table structure', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Col 1</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Col 1')).toBeTruthy();
      expect(screen.getByText('Cell 1')).toBeTruthy();
    });
  });
});
