// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@components/ui/drawer';

describe('Drawer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render drawer dialog content when open is true', () => {
    // Arrange & Act
    render(
      <Drawer open={true}>
        <DrawerContent side="right">
          <DrawerHeader>
            <DrawerTitle>Navigation Drawer</DrawerTitle>
            <DrawerDescription>Drawer subtitle</DrawerDescription>
          </DrawerHeader>
          <div>Drawer main body</div>
          <DrawerFooter>
            <span>Footer text</span>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );

    // Assert
    expect(screen.getByText('Navigation Drawer')).toBeTruthy();
    expect(screen.getByText('Drawer subtitle')).toBeTruthy();
    expect(screen.getByText('Drawer main body')).toBeTruthy();
    expect(screen.getByText('Footer text')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('should not render drawer popup when open is false', () => {
    // Arrange & Act
    render(
      <Drawer open={false}>
        <DrawerContent>
          <DrawerTitle>Hidden title</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );

    // Assert
    expect(screen.queryByText('Hidden title')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
