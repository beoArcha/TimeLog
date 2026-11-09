// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@components/ui/tooltip';

describe('Unit Tests: Popover, DropdownMenu, and Tooltip Positioning', () => {
  afterEach(() => {
    cleanup();
  });

  describe('PopoverContent', () => {
    it('should render popup with relative positioning and z-50 class on positioner', () => {
      // Arrange
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent data-testid="test-popover">Popover Content</PopoverContent>
        </Popover>
      );

      // Act
      const popup = screen.getByTestId('test-popover');

      // Assert
      expect(popup).toBeTruthy();
      expect(popup.className).toContain('relative');
      expect(popup.className).toContain('z-50');

      const positioner = popup.parentElement;
      expect(positioner).not.toBeNull();
      expect(positioner?.className).toContain('z-50');
    });

    it('should allow custom positionerClassName while preserving z-50', () => {
      // Arrange
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent
            data-testid="test-popover-custom"
            positionerClassName="custom-pos-class"
          >
            Custom Positioner
          </PopoverContent>
        </Popover>
      );

      // Act
      const popup = screen.getByTestId('test-popover-custom');
      const positioner = popup.parentElement;

      // Assert
      expect(positioner?.className).toContain('z-50');
      expect(positioner?.className).toContain('custom-pos-class');
    });
  });

  describe('DropdownMenuContent', () => {
    it('should render popup with relative positioning and z-50 class on positioner', () => {
      // Arrange
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="test-dropdown">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      // Act
      const popup = screen.getByTestId('test-dropdown');

      // Assert
      expect(popup).toBeTruthy();
      expect(popup.className).toContain('relative');
      expect(popup.className).toContain('z-50');

      const positioner = popup.parentElement;
      expect(positioner).not.toBeNull();
      expect(positioner?.className).toContain('z-50');
    });

    it('should allow custom positionerClassName on DropdownMenu', () => {
      // Arrange
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="test-dropdown-custom"
            positionerClassName="custom-menu-pos"
          >
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      // Act
      const popup = screen.getByTestId('test-dropdown-custom');
      const positioner = popup.parentElement;

      // Assert
      expect(positioner?.className).toContain('z-50');
      expect(positioner?.className).toContain('custom-menu-pos');
    });
  });

  describe('TooltipContent', () => {
    it('should render tooltip with relative positioning and z-50 class on positioner', () => {
      // Arrange
      render(
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent data-testid="test-tooltip">Tooltip details</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      // Act
      const popup = screen.getByTestId('test-tooltip');

      // Assert
      expect(popup).toBeTruthy();
      expect(popup.className).toContain('relative');
      expect(popup.className).toContain('z-50');

      const positioner = popup.parentElement;
      expect(positioner).not.toBeNull();
      expect(positioner?.className).toContain('z-50');
    });

    it('should allow custom positionerClassName on Tooltip', () => {
      // Arrange
      render(
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent
              data-testid="test-tooltip-custom"
              positionerClassName="custom-tooltip-pos"
            >
              Tooltip details
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      // Act
      const popup = screen.getByTestId('test-tooltip-custom');
      const positioner = popup.parentElement;

      // Assert
      expect(positioner?.className).toContain('z-50');
      expect(positioner?.className).toContain('custom-tooltip-pos');
    });
  });
});
