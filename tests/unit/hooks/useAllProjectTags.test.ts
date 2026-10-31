import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAllProjectTags } from '@common/hooks/useAllProjectTags';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import type { Project } from '@bindings/Project';

describe('useAllProjectTags', () => {
  it('should return empty array when there are no projects in DataContext', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(MockProviders, { dataState: { projects: [] } }, children);

    // Act
    const { result } = renderHook(() => useAllProjectTags(), { wrapper });

    // Assert
    expect(result.current).toEqual([]);
  });

  it('should deduplicate tags across projects while preserving letter case', () => {
    // Arrange
    const projects: Project[] = [
      {
        id: 'p1',
        name: 'Project 1',
        color: 'teal',
        archived: false,
        createdAt: '2026-01-01',
        description: null,
        icon: null,
        tags: ['Frontend', 'react', 'UI'],
        allowConcurrency: false,
      },
      {
        id: 'p2',
        name: 'Project 2',
        color: 'rose',
        archived: false,
        createdAt: '2026-01-02',
        description: null,
        icon: null,
        tags: ['Frontend', 'Backend', 'react'],
        allowConcurrency: false,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(MockProviders, { dataState: { projects } }, children);

    // Act
    const { result } = renderHook(() => useAllProjectTags(), { wrapper });

    // Assert
    expect(result.current).toEqual(['Backend', 'Frontend', 'react', 'UI']);
    expect(result.current.filter((tag) => tag === 'Frontend')).toHaveLength(1);
    expect(result.current.filter((tag) => tag === 'react')).toHaveLength(1);
  });

  it('should ignore empty and whitespace-only tags and trim padded tags', () => {
    // Arrange
    const projects: Project[] = [
      {
        id: 'p1',
        name: 'Project 1',
        color: 'teal',
        archived: false,
        createdAt: '2026-01-01',
        description: null,
        icon: null,
        tags: ['', '   ', '  valid-tag  ', 'another-tag'],
        allowConcurrency: false,
      },
      {
        id: 'p2',
        name: 'Project 2',
        color: 'violet',
        archived: false,
        createdAt: '2026-01-02',
        description: null,
        icon: null,
        tags: null,
        allowConcurrency: false,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(MockProviders, { dataState: { projects } }, children);

    // Act
    const { result } = renderHook(() => useAllProjectTags(), { wrapper });

    // Assert
    expect(result.current).toEqual(['another-tag', 'valid-tag']);
  });

  it('should sort tags alphabetically regardless of project order', () => {
    // Arrange
    const projects: Project[] = [
      {
        id: 'p1',
        name: 'Project 1',
        color: 'teal',
        archived: false,
        createdAt: '2026-01-01',
        description: null,
        icon: null,
        tags: ['zebra', 'alpha'],
        allowConcurrency: false,
      },
      {
        id: 'p2',
        name: 'Project 2',
        color: 'emerald',
        archived: false,
        createdAt: '2026-01-02',
        description: null,
        icon: null,
        tags: ['mango', 'beta'],
        allowConcurrency: false,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(MockProviders, { dataState: { projects } }, children);

    // Act
    const { result } = renderHook(() => useAllProjectTags(), { wrapper });

    // Assert
    expect(result.current).toEqual(['alpha', 'beta', 'mango', 'zebra']);
  });
});
