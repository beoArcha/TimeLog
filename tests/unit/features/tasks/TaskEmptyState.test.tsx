// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import TaskEmptyState from '../../../../src/features/tasks/components/TaskEmptyState';

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
});
