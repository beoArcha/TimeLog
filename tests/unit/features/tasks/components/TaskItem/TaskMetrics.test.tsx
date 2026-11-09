// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TaskMetrics } from "@features/tasks/components/TaskItem/TaskMetrics";
import { aTask } from "@tests/shared/builders/entity-builders";
import { TaskEditingProvider } from "@features/tasks/context/TaskEditingContext";
import { MockDataProvider, MockProviders } from "@tests/shared/mocks/MockProviders";
import type { DataState } from "@common/hooks/DataContext";
import type { TimeLog } from "@bindings/TimeLog";

describe("Unit Tests: TaskMetrics", () => {
  const onStartTimerMock = vi.fn();
  const onStopTimerMock = vi.fn();
  const setShowSubtaskFormForIdMock = vi.fn();

  const mockProps = {
    rootTask: aTask({
      id: "t1",
      projectId: "p1",
      name: "Task One",
      completed: false,
    }),
    rootDuration: 3600,
    isCurrentRunning: false,
    isAnyRunning: false,
    isCondensed: false,
    showSubtaskFormForId: null,
    onStartTimer: onStartTimerMock,
    onStopTimer: onStopTimerMock,
    setShowSubtaskFormForId: setShowSubtaskFormForIdMock,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("should calculate and display task duration seconds metrics", () => {
    // Arrange & Act
    render(<TaskMetrics {...mockProps} />);

    // Assert
    expect(screen.getByText(/01:00:00/)).toBeTruthy();
  });

  it("should trigger onStartTimer when clicking start button on non-completed task", () => {
    // Arrange
    render(<TaskMetrics {...mockProps} />);

    // Act
    const startBtn = screen.getByRole("button", {
      name: /StartMeasurement|Start/i,
    });
    fireEvent.click(startBtn);

    // Assert
    expect(onStartTimerMock).toHaveBeenCalledWith("t1");
  });

  it("should not render start/stop button or add subtask button when task is completed", () => {
    // Arrange
    const completedTask = aTask({ id: "t1", completed: true });

    // Act
    render(<TaskMetrics {...mockProps} rootTask={completedTask} />);

    // Assert
    const startBtn = screen.queryByRole("button", {
      name: /StartMeasurement|Start/i,
    });
    const subtaskBtn = screen.queryByRole("button", {
      name: /AddSubtask|Subtask/i,
    });
    expect(startBtn).toBeNull();
    expect(subtaskBtn).toBeNull();
  });

  it("should restore start/stop button and add subtask button when task is uncompleted", () => {
    // Arrange
    const completedTask = aTask({ id: "t1", completed: true });
    const { rerender } = render(<TaskMetrics {...mockProps} rootTask={completedTask} />);
    expect(screen.queryByRole("button", { name: /StartMeasurement|Start/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /AddSubtask|Subtask/i })).toBeNull();

    // Act
    const activeTask = aTask({ id: "t1", completed: false });
    rerender(<TaskMetrics {...mockProps} rootTask={activeTask} />);

    // Assert
    expect(screen.getByRole("button", { name: /StartMeasurement|Start/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /AddSubtask|Subtask/i })).toBeTruthy();
  });

  it("should render stop button when isCurrentRunning is true and trigger onStopTimer with projectId", () => {
    // Arrange
    render(<TaskMetrics {...mockProps} isCurrentRunning={true} />);

    // Act
    const stopBtn = screen.getByRole("button", {
      name: /StopMeasurement|Stop/i,
    });
    fireEvent.click(stopBtn);

    // Assert
    expect(onStopTimerMock).toHaveBeenCalledWith("p1");
  });

  it("should toggle showSubtaskFormForId when clicking Add Subtask button", () => {
    // Arrange
    const { rerender } = render(
      <TaskMetrics {...mockProps} showSubtaskFormForId={null} />,
    );

    // Act - open subtask form
    const addSubtaskBtn = screen.getByRole("button", {
      name: /AddSubtask|Subtask/i,
    });
    fireEvent.click(addSubtaskBtn);

    // Assert opening
    expect(setShowSubtaskFormForIdMock).toHaveBeenCalledWith("t1");

    // Re-render as open and click again to close
    rerender(<TaskMetrics {...mockProps} showSubtaskFormForId="t1" />);
    fireEvent.click(addSubtaskBtn);

    // Assert closing
    expect(setShowSubtaskFormForIdMock).toHaveBeenCalledWith(null);
  });

  it("should apply pulse animation styling when isAnyRunning is true", () => {
    // Arrange & Act
    const { container } = render(
      <TaskMetrics {...mockProps} isAnyRunning={true} />,
    );

    // Assert
    const badge = container.querySelector(".animate-pulse");
    expect(badge).not.toBeNull();
  });

  it("should resolve fallback timer handlers from DataContext when callbacks are omitted", () => {
    // Arrange
    const handleStartTimer = vi.fn();
    const handleStopTimer = vi.fn();

    render(
      <MockDataProvider value={{ handleStartTimer, handleStopTimer } as unknown as Partial<DataState>}>
        <TaskEditingProvider>
          <TaskMetrics
            rootTask={mockProps.rootTask}
            rootDuration={120}
            isCurrentRunning={false}
            isAnyRunning={false}
            isCondensed={false}
          />
        </TaskEditingProvider>
      </MockDataProvider>,
    );

    // Act
    const startBtn = screen.getByRole("button", {
      name: /StartMeasurement|Start/i,
    });
    fireEvent.click(startBtn);

    // Assert
    expect(handleStartTimer).toHaveBeenCalledWith("t1");
  });

  describe("A5: Interactive counter double-click and space bar actions", () => {
    const mockLog1: TimeLog = {
      id: "log-1",
      taskId: "t1",
      projectId: "p1",
      startTime: "2026-11-09T08:00:00Z",
      endTime: "2026-11-09T09:00:00Z",
      note: "Work session 1",
    };

    const mockLog2: TimeLog = {
      id: "log-2",
      taskId: "t1",
      projectId: "p1",
      startTime: "2026-11-09T09:30:00Z",
      endTime: "2026-11-09T10:30:00Z",
      note: "Work session 2",
    };

    it("should render counter as an interactive button with tabIndex=0 and descriptive aria-label", () => {
      render(
        <MockProviders>
          <TaskMetrics {...mockProps} rootDuration={3600} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      expect(counter.tagName.toLowerCase()).toBe("button");
      expect(counter.getAttribute("tabindex")).toBe("0");
      expect(counter.tabIndex).toBe(0);
      expect(counter.getAttribute("type")).toBe("button");
      expect(counter.getAttribute("aria-label")).toMatch(/01:00:00/i);
      expect(counter.getAttribute("title")).toBeTruthy();
    });

    it("should open logs popover on userEvent.dblClick when task has multiple logs", async () => {
      const user = userEvent.setup();
      const onOpenLogs = vi.fn();

      render(
        <MockProviders dataState={{ logs: [mockLog1, mockLog2] }}>
          <TaskMetrics {...mockProps} logs={[mockLog1, mockLog2]} onOpenLogs={onOpenLogs} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      await user.dblClick(counter);

      expect(onOpenLogs).toHaveBeenCalled();
      const popover = await screen.findByTestId("task-logs-popover-t1");
      expect(popover).not.toBeNull();
      expect(screen.getByTestId("log-item-log-1")).not.toBeNull();
      expect(screen.getByTestId("log-item-log-2")).not.toBeNull();
    });

    it("should open logs popover on pressing Space (userEvent.keyboard(' ')) on focused counter", async () => {
      const user = userEvent.setup();
      const onOpenLogs = vi.fn();

      render(
        <MockProviders dataState={{ logs: [mockLog1, mockLog2] }}>
          <TaskMetrics {...mockProps} logs={[mockLog1, mockLog2]} onOpenLogs={onOpenLogs} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      counter.focus();
      expect(document.activeElement).toBe(counter);

      await user.keyboard(" ");

      expect(onOpenLogs).toHaveBeenCalled();
      const popover = await screen.findByTestId("task-logs-popover-t1");
      expect(popover).not.toBeNull();
      expect(screen.getByTestId("log-item-log-1")).not.toBeNull();
      expect(screen.getByTestId("log-item-log-2")).not.toBeNull();
    });

    it("should open ReportLogEditModal directly on dblClick when task has exactly one log", async () => {
      const user = userEvent.setup();
      const onOpenLogs = vi.fn();

      render(
        <MockProviders dataState={{ logs: [mockLog1] }}>
          <TaskMetrics {...mockProps} logs={[mockLog1]} onOpenLogs={onOpenLogs} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      await user.dblClick(counter);

      expect(onOpenLogs).toHaveBeenCalled();
      expect(screen.queryByTestId("task-logs-popover-t1")).toBeNull();
      const startInput = await screen.findByTestId("audit-edit-start-time");
      expect((startInput as HTMLInputElement).value).toBe("2026-11-09 08:00:00");
    });

    it("should open ReportLogEditModal directly on pressing Space when task has an active log", async () => {
      const user = userEvent.setup();
      const onOpenLogs = vi.fn();
      const activeLog: TimeLog = {
        id: "active-log-1",
        taskId: "t1",
        projectId: "p1",
        startTime: "2026-11-09T11:00:00Z",
        endTime: null,
        note: "Currently timing",
      };

      render(
        <MockProviders dataState={{ logs: [mockLog1, activeLog], activeLog }}>
          <TaskMetrics
            {...mockProps}
            logs={[mockLog1, activeLog]}
            activeLog={activeLog}
            onOpenLogs={onOpenLogs}
          />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      counter.focus();
      await user.keyboard(" ");

      expect(onOpenLogs).toHaveBeenCalled();
      expect(screen.queryByTestId("task-logs-popover-t1")).toBeNull();
      const startInput = await screen.findByTestId("audit-edit-start-time");
      expect((startInput as HTMLInputElement).value).toBe("2026-11-09 11:00:00");
    });

    it("should open ReportLogEditModal upon selecting a log from the popover", async () => {
      const user = userEvent.setup();

      render(
        <MockProviders dataState={{ logs: [mockLog1, mockLog2] }}>
          <TaskMetrics {...mockProps} logs={[mockLog1, mockLog2]} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      await user.dblClick(counter);

      const logItemBtn = await screen.findByTestId("log-item-log-2");
      await user.click(logItemBtn);

      const startInput = await screen.findByTestId("audit-edit-start-time");
      expect((startInput as HTMLInputElement).value).toBe("2026-11-09 09:30:00");
    });

    it("should not open logs history or modal on a single click", async () => {
      const user = userEvent.setup();
      const onOpenLogs = vi.fn();

      render(
        <MockProviders dataState={{ logs: [mockLog1, mockLog2] }}>
          <TaskMetrics {...mockProps} logs={[mockLog1, mockLog2]} onOpenLogs={onOpenLogs} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      await user.click(counter);

      expect(onOpenLogs).not.toHaveBeenCalled();
      expect(screen.queryByTestId("task-logs-popover-t1")).toBeNull();
      expect(screen.queryByTestId("audit-edit-start-time")).toBeNull();
    });

    it("should not trigger counter open action when pressing Space on Start button", async () => {
      const user = userEvent.setup();
      const onOpenLogs = vi.fn();

      render(
        <MockProviders dataState={{ logs: [mockLog1, mockLog2] }}>
          <TaskMetrics {...mockProps} logs={[mockLog1, mockLog2]} onOpenLogs={onOpenLogs} />
        </MockProviders>
      );

      const startBtn = screen.getByRole("button", {
        name: /StartMeasurement|Start/i,
      });
      startBtn.focus();
      expect(document.activeElement).toBe(startBtn);

      await user.keyboard(" ");

      expect(onOpenLogs).not.toHaveBeenCalled();
      expect(onStartTimerMock).toHaveBeenCalledWith("t1");
      expect(screen.queryByTestId("task-logs-popover-t1")).toBeNull();
    });

    it("should display NoLogs message in popover when task has 0 logs", async () => {
      const user = userEvent.setup();

      render(
        <MockProviders dataState={{ logs: [] }}>
          <TaskMetrics {...mockProps} logs={[]} />
        </MockProviders>
      );

      const counter = screen.getByTestId("task-counter-btn-t1");
      await user.dblClick(counter);

      const popover = await screen.findByTestId("task-logs-popover-t1");
      expect(popover).not.toBeNull();
      expect(screen.getByText(/No time logs recorded|Brak zarejestrowanych wpisów czasu/i)).not.toBeNull();
    });

    it("logs refreshData failure after a successful log deletion without leaving an unhandled rejection", async () => {
      const user = userEvent.setup();
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const handleDeleteTimeLog = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
      const refreshData = vi.fn().mockRejectedValue(new Error("Refresh failed"));

      render(
        <MockProviders dataState={{ logs: [mockLog1], handleDeleteTimeLog, refreshData }}>
          <TaskMetrics {...mockProps} logs={[mockLog1]} />
        </MockProviders>
      );

      await user.dblClick(screen.getByTestId("task-counter-btn-t1"));
      await user.click(await screen.findByTestId("audit-delete-button"));
      await user.click(await screen.findByTestId("confirm-dialog-confirm-btn"));

      await waitFor(() => {
        expect(handleDeleteTimeLog).toHaveBeenCalledTimes(1);
        expect(refreshData).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("[TaskMetrics] refreshData failed after log mutation:"),
          expect.any(Error)
        );
        expect(screen.queryByTestId("audit-delete-button")).toBeNull();
      });
    });

    it("should save edited time log with UTC ISO timestamps when saved from modal opened via dblClick", async () => {
      const user = userEvent.setup();
      const handleEditTimeLog = vi.fn().mockResolvedValue({ saved: true, synchronized: true });
      const refreshData = vi.fn().mockResolvedValue(undefined);

      render(
        <MockProviders dataState={{ logs: [mockLog1], handleEditTimeLog, refreshData }}>
          <TaskMetrics {...mockProps} logs={[mockLog1]} />
        </MockProviders>
      );

      await user.dblClick(screen.getByTestId("task-counter-btn-t1"));

      const startInput = await screen.findByTestId("audit-edit-start-time");
      const endInput = screen.getByTestId("audit-edit-end-time");
      expect((startInput as HTMLInputElement).value).toBe("2026-11-09 08:00:00");
      expect((endInput as HTMLInputElement).value).toBe("2026-11-09 09:00:00");

      const reasonInput = screen.getByTestId("audit-edit-reason");
      await user.type(reasonInput, "Reviewed and verified time window");

      const saveBtn = screen.getByTestId("audit-save-button");
      await user.click(saveBtn);

      await waitFor(() => {
        expect(handleEditTimeLog).toHaveBeenCalledWith(
          "log-1",
          "t1",
          "2026-11-09T08:00:00.000Z",
          "2026-11-09T09:00:00.000Z",
          "Work session 1",
          "Reviewed and verified time window"
        );
        expect(screen.queryByTestId("audit-edit-start-time")).toBeNull();
      });
    });

    it("should propagate configured timezone from settings, display localized wall-clock time, and convert back to UTC on save", async () => {
      const user = userEvent.setup();
      const handleEditTimeLog = vi.fn().mockResolvedValue({ saved: true, synchronized: true });

      // America/New_York is UTC-5 in November (EST). 08:00:00Z -> 03:00:00, 09:00:00Z -> 04:00:00
      render(
        <MockProviders
          dataState={{ logs: [mockLog1], handleEditTimeLog }}
          settingsState={{ timezone: "America/New_York", resolvedTimezone: "America/New_York" }}
        >
          <TaskMetrics {...mockProps} logs={[mockLog1]} />
        </MockProviders>
      );

      await user.dblClick(screen.getByTestId("task-counter-btn-t1"));

      const startInput = await screen.findByTestId("audit-edit-start-time");
      const endInput = screen.getByTestId("audit-edit-end-time");
      expect((startInput as HTMLInputElement).value).toBe("2026-11-09 03:00:00");
      expect((endInput as HTMLInputElement).value).toBe("2026-11-09 04:00:00");

      // Edit wall-clock time to 04:00:00 (which is 09:00:00Z)
      fireEvent.change(startInput, { target: { value: "2026-11-09 04:00:00" } });
      const reasonInput = screen.getByTestId("audit-edit-reason");
      await user.type(reasonInput, "Adjusted per client meeting time");

      const saveBtn = screen.getByTestId("audit-save-button");
      await user.click(saveBtn);

      await waitFor(() => {
        expect(handleEditTimeLog).toHaveBeenCalledWith(
          "log-1",
          "t1",
          "2026-11-09T09:00:00.000Z",
          "2026-11-09T09:00:00.000Z",
          "Work session 1",
          "Adjusted per client meeting time"
        );
        expect(screen.queryByTestId("audit-edit-start-time")).toBeNull();
      });
    });

    it("should reject DST gap local time when modal is opened from TaskMetrics", async () => {
      const user = userEvent.setup();
      const handleEditTimeLog = vi.fn().mockResolvedValue({ saved: true, synchronized: true });

      render(
        <MockProviders
          dataState={{ logs: [mockLog1], handleEditTimeLog }}
          settingsState={{ timezone: "Europe/Warsaw", resolvedTimezone: "Europe/Warsaw" }}
        >
          <TaskMetrics {...mockProps} logs={[mockLog1]} />
        </MockProviders>
      );

      await user.dblClick(screen.getByTestId("task-counter-btn-t1"));

      const startInput = await screen.findByTestId("audit-edit-start-time");
      // 2026-03-29 02:30:00 does not exist in Europe/Warsaw (clocks jump 02:00 -> 03:00)
      fireEvent.change(startInput, { target: { value: "2026-03-29 02:30:00" } });

      const reasonInput = screen.getByTestId("audit-edit-reason");
      await user.type(reasonInput, "Testing invalid gap time");

      const saveBtn = screen.getByTestId("audit-save-button");
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByTestId("audit-range-error")).not.toBeNull();
        expect(handleEditTimeLog).not.toHaveBeenCalled();
      });
    });

    it("should accept explicit ISO offset entered in inputs and preserve exact instant", async () => {
      const user = userEvent.setup();
      const handleEditTimeLog = vi.fn().mockResolvedValue({ saved: true, synchronized: true });

      render(
        <MockProviders
          dataState={{ logs: [mockLog1], handleEditTimeLog }}
          settingsState={{ timezone: "America/New_York", resolvedTimezone: "America/New_York" }}
        >
          <TaskMetrics {...mockProps} logs={[mockLog1]} />
        </MockProviders>
      );

      await user.dblClick(screen.getByTestId("task-counter-btn-t1"));

      const startInput = await screen.findByTestId("audit-edit-start-time");
      // Explicit ISO timestamp with UTC 'Z'
      fireEvent.change(startInput, { target: { value: "2026-11-09T08:00:00Z" } });

      const reasonInput = screen.getByTestId("audit-edit-reason");
      await user.type(reasonInput, "Direct ISO entry with Z");

      const saveBtn = screen.getByTestId("audit-save-button");
      await user.click(saveBtn);

      await waitFor(() => {
        expect(handleEditTimeLog).toHaveBeenCalledWith(
          "log-1",
          "t1",
          "2026-11-09T08:00:00.000Z",
          "2026-11-09T09:00:00.000Z",
          "Work session 1",
          "Direct ISO entry with Z"
        );
        expect(screen.queryByTestId("audit-edit-start-time")).toBeNull();
      });
    });
  });
});
