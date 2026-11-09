// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReportLogRow } from '@features/reports/components/ReportLogRow';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

describe('Unit Tests: ReportLogRow', () => {
  afterEach(() => {
    cleanup();
  });
  const sampleProject = {
    id: 'p1',
    name: 'Project Alpha',
    color: 'indigo',
    createdAt: '2026-06-15',
  };

  const sampleTask = {
    id: 't1',
    projectId: 'p1',
    name: 'Task 1',
    completed: false,
    createdAt: '2026-06-15',
  };

  const sampleLog = {
    id: 'log-1',
    taskId: 't1',
    projectId: 'p1',
    startTime: '2026-06-15T10:00:00Z',
    endTime: '2026-06-15T11:00:00Z',
  };

  it('Given standard log, When rendered, Then displays task, project, formatted duration and action buttons', () => {
    // Arrange
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    // Act
    render(
      <MockProviders>
        <ReportLogRow
          log={sampleLog}
          project={sampleProject}
          task={sampleTask}
          isActive={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText(/"Task 1"/i)).not.toBeNull();
    expect(screen.getByText(/\(Project Alpha\)/i)).not.toBeNull();
    expect(screen.getByTestId('edit-log-log-1')).not.toBeNull();
    expect(screen.getByTestId('delete-log-log-1')).not.toBeNull();

    fireEvent.click(screen.getByTestId('edit-log-log-1'));
    expect(onEdit).toHaveBeenCalledWith(sampleLog);

    fireEvent.click(screen.getByTestId('delete-log-log-1'));
    expect(onDelete).toHaveBeenCalledWith(sampleLog);
  });

  it('Given active log, When rendered, Then disables edit and delete buttons', () => {
    // Arrange
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    // Act
    render(
      <MockProviders>
        <ReportLogRow
          log={sampleLog}
          project={sampleProject}
          task={sampleTask}
          isActive={true}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MockProviders>
    );

    // Assert
    const editBtn = screen.getByTestId('edit-log-log-1');
    const deleteBtn = screen.getByTestId('delete-log-log-1');
    expect(editBtn.getAttribute('disabled')).not.toBeNull();
    expect(deleteBtn.getAttribute('disabled')).not.toBeNull();
  });

  it('Given a patch log, When rendered, Then renders Patch badge and hides edit and delete buttons', () => {
    // Arrange
    const patchLog: ClampedTimeLog = {
      id: 'patch-1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T10:30:00Z',
      originalDurationSeconds: 1800,
      clampedDurationSeconds: 1800,
      isMultiDaySegment: false,
      clampedStartTime: '2026-06-15T10:00:00Z',
      clampedEndTime: '2026-06-15T10:30:00Z',
      isPatch: true,
    };

    // Act
    render(
      <MockProviders>
        <ReportLogRow
          log={patchLog}
          project={sampleProject}
          task={sampleTask}
          isActive={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MockProviders>
    );

    // Assert
    expect(screen.queryByTestId('edit-log-patch-1')).toBeNull();
    expect(screen.queryByTestId('delete-log-patch-1')).toBeNull();
  });

  it('Given preferred timezone in settings context, When rendered without explicit prop, Then formats screen time in preferred timezone and print time in UTC', () => {
    // Arrange: log starts at 10:00:00Z. In Tokyo (UTC+9), screen time is 19:00:00.
    const tokyoLog = {
      id: 'log-tz-1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
    };

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'Asia/Tokyo', resolvedTimezone: 'Asia/Tokyo' }}
        localeState={{ locale: 'pl' }}
      >
        <ReportLogRow
          log={tokyoLog}
          project={sampleProject}
          task={sampleTask}
          isActive={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MockProviders>
    );

    // Assert
    const screenTime = screen.getByTestId('log-entry-screen-time');
    const printTime = screen.getByTestId('log-entry-print-datetime');

    // Screen time reflects Asia/Tokyo (10:00 UTC + 9h = 19:00:00)
    expect(screenTime.textContent).toContain('19:00:00');

    // Print datetime deterministically remains in UTC (10:00:00)
    expect(printTime.textContent).toContain('10:00:00');
    expect(printTime.textContent).toContain('15.06.2026');
  });

  it('Given explicit timeZone prop, When rendered, Then explicit prop takes precedence over settings context for screen time while keeping print in UTC', () => {
    // Arrange: log starts at 12:00:00Z. Context says Tokyo (+9), but explicit prop says UTC.
    const testLog = {
      id: 'log-tz-2',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T12:00:00Z',
      endTime: '2026-06-15T13:00:00Z',
    };

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'Asia/Tokyo', resolvedTimezone: 'Asia/Tokyo' }}
        localeState={{ locale: 'pl' }}
      >
        <ReportLogRow
          log={testLog}
          project={sampleProject}
          task={sampleTask}
          isActive={false}
          timeZone="UTC"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MockProviders>
    );

    // Assert: Screen time uses explicit UTC prop
    const screenTime = screen.getByTestId('log-entry-screen-time');
    const printTime = screen.getByTestId('log-entry-print-datetime');

    expect(screenTime.textContent).toContain('12:00:00');
    expect(printTime.textContent).toContain('12:00:00');
  });
});
