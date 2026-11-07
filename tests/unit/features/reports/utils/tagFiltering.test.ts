import { describe, it, expect } from 'vitest';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import {
  normalizeTag,
  extractAvailableTags,
  projectMatchesTags,
  filterProjectsByTags,
  filterTasksByProjectIds,
  filterTimeLogsByTagFilter,
} from '@features/reports/utils/tagFiltering';

describe('Unit Tests: tagFiltering helpers', () => {
  describe('normalizeTag', () => {
    it('Given a raw tag with leading/trailing spaces, When normalizing, Then trims whitespace', () => {
      // Arrange
      const rawTag = '  feature-x  ';

      // Act
      const normalized = normalizeTag(rawTag);

      // Assert
      expect(normalized).toBe('feature-x');
    });

    it('Given a tag with a leading hash (#), When normalizing, Then strips hash and trims', () => {
      // Arrange
      const rawTag = ' #urgent ';

      // Act
      const normalized = normalizeTag(rawTag);

      // Assert
      expect(normalized).toBe('urgent');
    });

    it('Given an empty string or whitespace only, When normalizing, Then returns empty string', () => {
      // Arrange & Act & Assert
      expect(normalizeTag('')).toBe('');
      expect(normalizeTag('   ')).toBe('');
      expect(normalizeTag('#')).toBe('');
    });
  });
  const sampleProjects: Project[] = [
    {
      id: 'p1',
      name: 'Project Alpha',
      color: 'indigo',
      createdAt: '2026-06-15T00:00:00Z',
      tags: ['frontend', 'react', '  design  '],
    },
    {
      id: 'p2',
      name: 'Project Beta',
      color: 'emerald',
      createdAt: '2026-06-15T00:00:00Z',
      tags: ['backend', 'react', 'api'],
    },
    {
      id: 'p3',
      name: 'Project Gamma',
      color: 'amber',
      createdAt: '2026-06-15T00:00:00Z',
      tags: [],
    },
    {
      id: 'p4',
      name: 'Project Delta',
      color: 'rose',
      createdAt: '2026-06-15T00:00:00Z',
      tags: undefined as unknown as string[],
    },
  ];

  const sampleTasks: Task[] = [
    { id: 't1', projectId: 'p1', name: 'UI Components', completed: false, createdAt: '2026-06-15' },
    { id: 't2', projectId: 'p2', name: 'API Endpoints', completed: false, createdAt: '2026-06-15' },
    { id: 't3', projectId: 'p3', name: 'Docs', completed: false, createdAt: '2026-06-15' },
  ];

  describe('extractAvailableTags', () => {
    it('Given a list of projects with tags, When extracting tags, Then returns deduplicated, trimmed, sorted tags', () => {
      // Arrange
      const projects = sampleProjects;

      // Act
      const tags = extractAvailableTags(projects);

      // Assert
      expect(tags).toEqual(['api', 'backend', 'design', 'frontend', 'react']);
    });

    it('Given empty projects or projects without valid tags, When extracting tags, Then returns empty array', () => {
      // Arrange
      const projects: Project[] = [];

      // Act
      const tags = extractAvailableTags(projects);

      // Assert
      expect(tags).toEqual([]);
    });
  });

  describe('projectMatchesTags', () => {
    it('Given no selected tags, When checking project match, Then returns true', () => {
      // Arrange
      const project = sampleProjects[0];

      // Act & Assert
      expect(projectMatchesTags(project, [])).toBe(true);
      expect(projectMatchesTags(project, undefined)).toBe(true);
    });

    it('Given selected tags and a project matching at least one tag, When checking match, Then returns true', () => {
      // Arrange
      const project = sampleProjects[0];

      // Act
      const matches = projectMatchesTags(project, ['react', 'python']);

      // Assert
      expect(matches).toBe(true);
    });

    it('Given selected tags with whitespace and hash prefix, When checking match, Then matches normalized project tags', () => {
      // Arrange
      const project = sampleProjects[0]; // has 'design' with spaces

      // Act & Assert
      expect(projectMatchesTags(project, ['#design'])).toBe(true);
      expect(projectMatchesTags(project, ['  #frontend  '])).toBe(true);
    });

    it('Given selected tags and a project not containing any selected tag, When checking match, Then returns false', () => {
      // Arrange
      const project = sampleProjects[0];

      // Act
      const matches = projectMatchesTags(project, ['python', 'rust']);

      // Assert
      expect(matches).toBe(false);
    });

    it('Given null or project with no tags, When checking match with selected tags, Then returns false', () => {
      // Arrange & Act & Assert
      expect(projectMatchesTags(null, ['react'])).toBe(false);
      expect(projectMatchesTags(sampleProjects[2], ['react'])).toBe(false);
      expect(projectMatchesTags(sampleProjects[3], ['react'])).toBe(false);
    });
  });

  describe('filterProjectsByTags', () => {
    it('Given empty or undefined selectedTags, When filtering projects, Then returns original projects array', () => {
      // Arrange
      const projects = sampleProjects;

      // Act & Assert
      expect(filterProjectsByTags(projects, [])).toBe(projects);
      expect(filterProjectsByTags(projects, undefined)).toBe(projects);
    });

    it('Given selected tags, When filtering projects, Then returns only projects that contain matching tags', () => {
      // Arrange
      const projects = sampleProjects;

      // Act
      const filtered = filterProjectsByTags(projects, ['backend']);

      // Assert
      expect(filtered.map((p) => p.id)).toEqual(['p2']);
    });
  });

  describe('filterTasksByProjectIds', () => {
    it('Given tasks and matching project IDs set, When filtering tasks, Then returns tasks belonging to matching projects', () => {
      // Arrange
      const matchingIds = new Set(['p1', 'p2']);

      // Act
      const filtered = filterTasksByProjectIds(sampleTasks, matchingIds);

      // Assert
      expect(filtered.map((t) => t.id)).toEqual(['t1', 't2']);
    });
  });

  describe('filterTimeLogsByTagFilter', () => {
    const taskMap = new Map<string, Task>(sampleTasks.map((t) => [t.id, t]));

    const sampleLogs: TimeLog[] = [
      {
        id: 'l1',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
      },
      {
        id: 'l2',
        taskId: 't2',
        projectId: 'p2',
        startTime: '2026-06-15T11:00:00Z',
        endTime: '2026-06-15T12:00:00Z',
      },
      {
        id: 'l3',
        taskId: 't3',
        projectId: 'p3',
        startTime: '2026-06-15T12:00:00Z',
        endTime: '2026-06-15T13:00:00Z',
      },
      {
        id: 'l4',
        taskId: 'non-existent',
        projectId: 'p1',
        startTime: '2026-06-15T13:00:00Z',
        endTime: '2026-06-15T14:00:00Z',
      },
    ];

    it('Given logs and matching project IDs, When filtering, Then resolves project from taskMap or fallback projectId', () => {
      // Arrange
      const matchingIds = new Set(['p1']);

      // Act
      const filtered = filterTimeLogsByTagFilter(sampleLogs, matchingIds, taskMap);

      // Assert
      expect(filtered.map((l) => l.id)).toEqual(['l1', 'l4']);
    });

    it('Given patches and task list array, When filtering, Then filters patches correctly', () => {
      // Arrange
      const matchingIds = new Set(['p2']);
      const samplePatches: PatchLog[] = [
        {
          id: 'patch-1',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-06-15T10:00:00Z',
          endTime: '2026-06-15T10:30:00Z',
          patchNote: 'note 1',
        },
        {
          id: 'patch-2',
          projectId: 'p2',
          taskId: 't2',
          startTime: '2026-06-15T11:00:00Z',
          endTime: '2026-06-15T11:30:00Z',
          patchNote: 'note 2',
        },
      ];

      // Act
      const filtered = filterTimeLogsByTagFilter(samplePatches, matchingIds, sampleTasks);

      // Assert
      expect(filtered.map((p) => p.id)).toEqual(['patch-2']);
    });
  });
});
