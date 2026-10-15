import { describe, it, expect } from 'vitest';
import { getThemeStyles, PROJECT_COLORS } from '@layouts/parts/LayoutStyles';

describe('Unit Tests: GuiStyles', () => {
  it('should return semantic theme styles when theme is light', () => {
    const styles = getThemeStyles('light');
    expect(styles.bgMuted).toBe('bg-muted');
    expect(styles.textMain).toBe('text-foreground');
  });

  it('should return semantic theme styles when theme is dark or other', () => {
    const styles = getThemeStyles('dark');
    expect(styles.bgMuted).toBe('bg-muted');
    expect(styles.textMain).toBe('text-foreground');
  });

  it('should return correct layout definitions for project colors', () => {
    expect(PROJECT_COLORS.length).toBeGreaterThan(0);
  });
});
