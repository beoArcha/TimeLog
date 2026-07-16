import { describe, it, expect } from 'vitest';
import { getThemeStyles, PROJECT_COLORS } from '@layouts/parts/LayoutStyles';

describe('Unit Tests: GuiStyles', () => {
  it('should return light theme styles when theme is light', () => {
    const styles = getThemeStyles('light');
    expect(styles.bgMuted).toBe('bg-[#F4EFEA]');
    expect(styles.textMain).toBe('text-[#2C2421]');
  });

  it('should return dark theme styles when theme is dark or other', () => {
    const styles = getThemeStyles('dark');
    expect(styles.bgMuted).toBe('bg-black/20');
    expect(styles.textMain).toBe('text-white');
  });

  it('should return correct layout definitions for project colors', () => {
    expect(PROJECT_COLORS.length).toBeGreaterThan(0);
  });
});
