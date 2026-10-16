// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TaskMetrics } from "@features/tasks/components/TaskItem/TaskMetrics";
import { aTask } from "@tests/shared/builders/entity-builders";
import { TaskEditingProvider } from "@features/tasks/context/TaskEditingContext";
import { MockDataProvider } from "@tests/shared/mocks/MockProviders";

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

  it("should disable start button and prevent timer start when task is completed", () => {
    // Arrange
    const completedTask = aTask({ id: "t1", completed: true });
    render(<TaskMetrics {...mockProps} rootTask={completedTask} />);

    // Act
    const startBtn = screen.getByRole("button", {
      name: /StartMeasurement|Start/i,
    });
    expect(startBtn.hasAttribute("disabled")).toBe(true);
    fireEvent.click(startBtn);

    // Assert
    expect(onStartTimerMock).not.toHaveBeenCalled();
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
      <MockDataProvider value={{ handleStartTimer, handleStopTimer } as any}>
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
});
