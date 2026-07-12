import { describe, it, expect } from 'vitest';
import { getThemeStyles, getScaleStyles, PROJECT_COLORS, GUI_MIN_SIZES } from '../../../../src/layouts/parts/LayoutStyles';
import { TextAndIconSize } from '@bindings/TextAndIconSize';

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

  it('should return correct layout definitions for project colors and min sizes', () => {
    expect(PROJECT_COLORS.length).toBeGreaterThan(0);
    expect(GUI_MIN_SIZES.medium.small.minWidth).toBe('480px');
  });

  it('should return small scale styles when scale is small', () => {
    const styles = getScaleStyles('small');
    expect(styles.paddingMain).toBe('p-4');
    expect(styles.iconMedium).toBe('w-4 h-4');
  });

  it('should return medium scale styles when scale is medium', () => {
    const styles = getScaleStyles('medium');
    expect(styles.paddingMain).toBe('p-6');
    expect(styles.iconMedium).toBe('w-5 h-5');
  });

  it('should return large scale styles when scale is large', () => {
    const styles = getScaleStyles('large');
    expect(styles.paddingMain).toBe('p-8');
    expect(styles.iconMedium).toBe('w-7 h-7');
  });

  it('should fallback to medium scale styles when scale is unknown', () => {
    const styles = getScaleStyles('unknown' as TextAndIconSize);
    expect(styles.paddingMain).toBe('p-6');
    expect(styles.iconMedium).toBe('w-5 h-5');
  });
});
