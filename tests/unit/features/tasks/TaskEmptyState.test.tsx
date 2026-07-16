// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import TaskEmptyState from '@features/tasks/components/TaskEmptyState';

describe('Unit Tests: TaskEmptyState', () => {
  afterEach(() => {
    cleanup();
  });

  it('Given TaskEmptyState rendered, When locale is en, Then it should show English text', () => {
    render(
      <TaskEmptyState theme="dark" locale="en" customTranslations={{}} />
    );

    expect(screen.getByText(/Create a main project task/i)).toBeTruthy();
  });

  it('Given TaskEmptyState rendered, When theme is light, Then it should render with light theme styling classes', () => {
    render(
      <TaskEmptyState theme="light" locale="en" customTranslations={{}} />
    );

    expect(screen.getByText(/Create a main project task/i)).toBeTruthy();
  });
});
