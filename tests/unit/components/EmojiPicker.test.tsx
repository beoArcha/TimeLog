// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EmojiPicker } from '@components/ui/emoji-picker/EmojiPicker';
import { getFirstGrapheme } from '@components/ui/emoji-picker/emojiData';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('Unit Tests: getFirstGrapheme', () => {
  it('should return empty string for null, undefined, or empty string', () => {
    expect(getFirstGrapheme('')).toBe('');
  });

  it('should return single ASCII character', () => {
    expect(getFirstGrapheme('Hello')).toBe('H');
  });

  it('should preserve standard emoji', () => {
    expect(getFirstGrapheme('🚀Rocket')).toBe('🚀');
  });

  it('should preserve composite emoji with skin tone modifier', () => {
    const thumbsUpMedium = '👍🏽';
    expect(getFirstGrapheme(thumbsUpMedium)).toBe(thumbsUpMedium);
  });

  it('should preserve compound ZWJ emoji without truncation', () => {
    const technologist = '👨‍💻';
    expect(getFirstGrapheme(technologist)).toBe(technologist);
  });

  it('should preserve regional indicator flag emojis without splitting', () => {
    const polishFlag = '🇵🇱';
    expect(getFirstGrapheme(polishFlag)).toBe(polishFlag);
  });
});

describe('Unit Tests: EmojiPicker Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render trigger button with default smile icon when empty', () => {
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    const trigger = screen.getByTestId('emoji-picker-trigger');
    expect(trigger).not.toBeNull();
    expect(screen.queryByTestId('emoji-picker-current')).toBeNull();
  });

  it('should render current emoji in trigger when value is provided', () => {
    render(
      <MockProviders>
        <EmojiPicker value="🚀" onChange={vi.fn()} />
      </MockProviders>
    );

    const currentSpan = screen.getByTestId('emoji-picker-current');
    expect(currentSpan.textContent).toBe('🚀');
  });

  it('should open popover content on trigger click', () => {
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    expect(screen.getByTestId('emoji-picker-content')).not.toBeNull();
    expect(screen.getByTestId('emoji-picker-search-input')).not.toBeNull();
  });

  it('should select emoji from grid and invoke onChange callback', () => {
    const onChangeMock = vi.fn();
    render(
      <MockProviders>
        <EmojiPicker onChange={onChangeMock} />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    const rocketBtn = screen.getByTestId('emoji-picker-emoji-🚀');
    fireEvent.click(rocketBtn);

    expect(onChangeMock).toHaveBeenCalledWith('🚀');
  });

  it('should filter emojis when typing into search input', () => {
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    const searchInput = screen.getByTestId('emoji-picker-search-input');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    expect(screen.getByTestId('emoji-picker-emoji-💻')).not.toBeNull();
    expect(screen.queryByTestId('emoji-picker-emoji-🌴')).toBeNull();
  });

  it('should switch categories when category button is clicked', () => {
    render(
      <MockProviders>
        <EmojiPicker onChange={vi.fn()} />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    const lifeCategoryBtn = screen.getByTestId('emoji-picker-category-life');
    fireEvent.click(lifeCategoryBtn);

    expect(screen.getByTestId('emoji-picker-emoji-☕')).not.toBeNull();
    expect(screen.queryByTestId('emoji-picker-emoji-💻')).toBeNull();
  });

  it('should clear emoji when clear button is clicked', () => {
    const onChangeMock = vi.fn();
    render(
      <MockProviders>
        <EmojiPicker value="🚀" onChange={onChangeMock} />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('emoji-picker-trigger'));

    const clearBtn = screen.getByTestId('emoji-picker-clear-btn');
    fireEvent.click(clearBtn);

    expect(onChangeMock).toHaveBeenCalledWith('');
  });
});
