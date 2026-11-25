// @vitest-environment jsdom
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import AppBrowser from '@/src/app-browser/AppBrowser';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

vi.mock('@layouts/manager/LayoutManager', () => {
  function MockLayoutManager() {
    const caps = usePlatformCapabilities();
    return (
      <div
        data-testid="mock-layout-manager"
        data-supported-layouts={caps.supportedLayouts.join(',')}
        data-default-layout={caps.defaultLayout}
      />
    );
  }
  return { default: MockLayoutManager };
});

describe('AppBrowser mobile capability gating', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockViewportQuery = (initialMatches: boolean) => {
    let listener: ((event: MediaQueryListEvent) => void) | null = null;
    const mediaQueryList = {
      matches: initialMatches,
      media: '(max-width: 767px)',
      onchange: null,
      addEventListener: vi.fn((_type: string, cb: (event: MediaQueryListEvent) => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mediaQueryList as unknown as MediaQueryList),
    });

    return {
      triggerResize: (nextMatches: boolean) => {
        mediaQueryList.matches = nextMatches;
        if (listener) {
          listener({ matches: nextMatches } as MediaQueryListEvent);
        }
      },
    };
  };

  it('should restrict supportedLayouts to medium only when viewport is below 768px', () => {
    // Arrange
    mockViewportQuery(true);

    // Act
    render(<AppBrowser />);

    // Assert
    const manager = screen.getByTestId('mock-layout-manager');
    expect(manager.getAttribute('data-supported-layouts')).toBe('medium');
    expect(manager.getAttribute('data-default-layout')).toBe('medium');
  });

  it('should allow medium and full layouts when viewport is 768px or wider', () => {
    // Arrange
    mockViewportQuery(false);

    // Act
    render(<AppBrowser />);

    // Assert
    const manager = screen.getByTestId('mock-layout-manager');
    expect(manager.getAttribute('data-supported-layouts')).toBe('medium,full');
    expect(manager.getAttribute('data-default-layout')).toBe('full');
  });

  it('should update capabilities dynamically when crossing the 768px breakpoint', () => {
    // Arrange
    const { triggerResize } = mockViewportQuery(false);
    render(<AppBrowser />);

    const manager = screen.getByTestId('mock-layout-manager');
    expect(manager.getAttribute('data-supported-layouts')).toBe('medium,full');

    // Act
    act(() => {
      triggerResize(true);
    });

    // Assert
    expect(manager.getAttribute('data-supported-layouts')).toBe('medium');
    expect(manager.getAttribute('data-default-layout')).toBe('medium');
  });
});
