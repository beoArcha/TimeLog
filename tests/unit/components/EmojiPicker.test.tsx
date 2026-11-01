// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EmojiPicker } from '@components/EmojiPicker/EmojiPicker';
import { getFirstGrapheme, isEmoji } from '@components/EmojiPicker/emojiData';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('getFirstGrapheme', () => {
  it('should return empty string when input is empty or null', () => {
    // Arrange
    const emptyInput = '';

    // Act
    const result = getFirstGrapheme(emptyInput);

    // Assert
    expect(result).toBe('');
  });

  it('should return single ASCII character when given plain text', () => {
    // Arrange
    const text = 'Hello';

    // Act
    const result = getFirstGrapheme(text);

    // Assert
    expect(result).toBe('H');
  });

  it('should preserve standard emoji without truncation when given standard emoji text', () => {
    // Arrange
    const text = '🚀Rocket';

    // Act
    const result = getFirstGrapheme(text);

    // Assert
    expect(result).toBe('🚀');
  });

  it('should preserve composite emoji with skin tone modifier when given modified emoji', () => {
    // Arrange
    const thumbsUpMedium = '👍🏽';

    // Act
    const result = getFirstGrapheme(thumbsUpMedium);

    // Assert
    expect(result).toBe(thumbsUpMedium);
  });

  it('should preserve compound ZWJ emoji without truncation when given family or technologist', () => {
    // Arrange
    const technologist = '👨‍💻';
    const family = '👨‍👩‍👧‍👦';

    // Act
    const resultTechnologist = getFirstGrapheme(technologist);
    const resultFamily = getFirstGrapheme(family);

    // Assert
    expect(resultTechnologist).toBe(technologist);
    expect(resultFamily).toBe(family);
  });

  it('should preserve regional indicator flag emojis without splitting when given national flags', () => {
    // Arrange
    const polishFlag = '🇵🇱';

    // Act
    const result = getFirstGrapheme(polishFlag);

    // Assert
    expect(result).toBe(polishFlag);
  });

  it('should preserve keycap emoji sequence without splitting when given number keycap', () => {
    // Arrange
    const keycap = '1️⃣';

    // Act
    const result = getFirstGrapheme(keycap);

    // Assert
    expect(result).toBe(keycap);
  });

  it('should preserve compound ZWJ emojis and flags in fallback mode when Intl.Segmenter is unavailable', () => {
    // Arrange
    const originalDescriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter');
    Object.defineProperty(Intl, 'Segmenter', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      const technologist = '👨‍💻';
      const polishFlag = '🇵🇱';
      const thumbsUp = '👍🏽';

      // Act
      const resultTech = getFirstGrapheme(technologist);
      const resultFlag = getFirstGrapheme(polishFlag);
      const resultThumb = getFirstGrapheme(thumbsUp);

      // Assert
      expect(resultTech).toBe(technologist);
      expect(resultFlag).toBe(polishFlag);
      expect(resultThumb).toBe(thumbsUp);
    } finally {
      // Restore
      if (originalDescriptor) {
        Object.defineProperty(Intl, 'Segmenter', originalDescriptor);
      }
    }
  });
});

describe('isEmoji', () => {
  it('should return true when input is a standard emoji', () => {
    // Arrange
    const emoji = '🚀';

    // Act
    const result = isEmoji(emoji);

    // Assert
    expect(result).toBe(true);
  });

  it('should return true when input is a compound ZWJ emoji or skin tone modifier', () => {
    // Arrange
    const technologist = '👨‍💻';
    const thumbsUpMedium = '👍🏽';

    // Act & Assert
    expect(isEmoji(technologist)).toBe(true);
    expect(isEmoji(thumbsUpMedium)).toBe(true);
  });

  it('should return true when input is a regional indicator flag or keycap', () => {
    // Arrange
    const polishFlag = '🇵🇱';
    const keycap = '1️⃣';

    // Act & Assert
    expect(isEmoji(polishFlag)).toBe(true);
    expect(isEmoji(keycap)).toBe(true);
  });

  it('should return false when input is an ordinary text word or single letter', () => {
    // Arrange
    const word = 'rocketship';
    const letter = 'r';
    const empty = '';

    // Act & Assert
    expect(isEmoji(word)).toBe(false);
    expect(isEmoji(letter)).toBe(false);
    expect(isEmoji(empty)).toBe(false);
  });
});

describe('EmojiPicker', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render trigger button with default smile icon when empty', () => {
    // Arrange
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    const trigger = screen.getByTestId('emoji-picker-trigger');

    // Assert
    expect(trigger).not.toBeNull();
    expect(screen.queryByTestId('emoji-picker-current')).toBeNull();
  });

  it('should render current emoji in trigger when value is provided', () => {
    // Arrange
    render(
      <MockProviders>
        <EmojiPicker value="🚀" onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    const currentSpan = screen.getByTestId('emoji-picker-current');

    // Assert
    expect(currentSpan.textContent).toBe('🚀');
  });

  it('should open popover content when trigger is clicked', () => {
    // Arrange
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    // Assert
    expect(screen.getByTestId('emoji-picker-content')).not.toBeNull();
    expect(screen.getByTestId('emoji-picker-search-input')).not.toBeNull();
  });

  it('should select emoji from grid and invoke onChange callback when emoji is clicked', () => {
    // Arrange
    const onChangeMock = vi.fn();
    render(
      <MockProviders>
        <EmojiPicker onChange={onChangeMock} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));
    const rocketBtn = screen.getByTestId('emoji-picker-emoji-🚀');
    fireEvent.click(rocketBtn);

    // Assert
    expect(onChangeMock).toHaveBeenCalledWith('🚀');
  });

  it('should filter emojis when typing into search input', () => {
    // Arrange
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));
    const searchInput = screen.getByTestId('emoji-picker-search-input');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    // Assert
    expect(screen.getByTestId('emoji-picker-emoji-💻')).not.toBeNull();
    expect(screen.queryByTestId('emoji-picker-emoji-🌴')).toBeNull();
  });

  it('should switch categories and render localized category names when category button is clicked', () => {
    // Arrange
    render(
      <MockProviders state={{ locale: 'pl' }}>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    // Assert Polish localized label for Work category
    const workCategoryBtn = screen.getByTestId('emoji-picker-category-work');
    expect(workCategoryBtn.textContent).toBe('Praca');

    // Act
    const lifeCategoryBtn = screen.getByTestId('emoji-picker-category-life');
    fireEvent.click(lifeCategoryBtn);

    // Assert
    expect(screen.getByTestId('emoji-picker-emoji-☕')).not.toBeNull();
    expect(screen.queryByTestId('emoji-picker-emoji-💻')).toBeNull();
  });

  it('should allow selecting custom emoji when search input is a valid non-curated emoji', () => {
    // Arrange
    const onChangeMock = vi.fn();
    render(
      <MockProviders>
        <EmojiPicker onChange={onChangeMock} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));
    const searchInput = screen.getByTestId('emoji-picker-search-input');
    // Unicorn is not in curated list
    fireEvent.change(searchInput, { target: { value: '🦄' } });

    // Assert
    const customUseBtn = screen.getByTestId('emoji-picker-custom-use-btn');
    expect(customUseBtn).not.toBeNull();

    // Act
    fireEvent.click(customUseBtn);

    // Assert
    expect(onChangeMock).toHaveBeenCalledWith('🦄');
  });

  it('should not show custom-use button and display no-results label when searching ordinary text without curated match', () => {
    // Arrange
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));
    const searchInput = screen.getByTestId('emoji-picker-search-input');
    fireEvent.change(searchInput, { target: { value: 'rocketship' } });

    // Assert
    expect(screen.queryByTestId('emoji-picker-custom-use-btn')).toBeNull();
    const noResults = screen.getByTestId('emoji-picker-no-results');
    expect(noResults).not.toBeNull();
  });

  it('should clear emoji when clear button is clicked', () => {
    // Arrange
    const onChangeMock = vi.fn();
    render(
      <MockProviders>
        <EmojiPicker value="🚀" onChange={onChangeMock} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));
    const clearBtn = screen.getByTestId('emoji-picker-clear-btn');
    fireEvent.click(clearBtn);

    // Assert
    expect(onChangeMock).toHaveBeenCalledWith('');
  });

  it('should render category labels directly from translation without string fallbacks', () => {
    // Arrange
    const customTranslations = {
      project: {
        EmojiCategoryAll: 'CustomAll',
        EmojiCategoryWork: 'CustomWork',
      },
    };

    render(
      <MockProviders state={{ locale: 'custom', customTranslations }}>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    // Assert
    expect(screen.getByTestId('emoji-picker-category-all').textContent).toBe('CustomAll');
    expect(screen.getByTestId('emoji-picker-category-work').textContent).toBe('CustomWork');
  });
});

