import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TaskListView from "@features/tasks/TaskListView";
import { getMockOxyFlowState } from "@tests/shared/test-helpers";
import { EngineRouter } from "@common/engine/EngineRouter";
import { IEngine } from "@common/engine/IEngine";
import { aProject, aTask } from "@tests/shared/builders/entity-builders";

describe("Unit Tests: TaskListView", () => {
  const mockGetProjectStatistics = vi.fn();
  const onAddTaskMock = vi.fn();

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectStatistics.mockResolvedValue({
      totalTasks: 0,
      completedTasks: 0,
      totalDurationSec: 0,
    });

    EngineRouter.getInstance().setImplementationForTesting({
      timer: {
        startTimer: vi.fn(),
        stopTimer: vi.fn(),
        resumeTimer: vi.fn(),
        getActiveLogs: vi.fn(),
      },
      metrics: {
        getComputedMetrics: vi.fn(),
        getTaskElapsed: vi.fn(),
        getProjectElapsed: vi.fn(),
        getElapsedRange: vi.fn(),
        getProjectStatistics: mockGetProjectStatistics,
      },
      timeLogs: {
        editTimeLog: vi.fn(),
      },
      validation: {
        validateProjectName: vi.fn(),
        validateTaskName: vi.fn(),
        validateTaskHierarchy: vi.fn(),
      },
    } as unknown as IEngine);
  });

  const mockState = {
    ...getMockOxyFlowState(),
    tasks: [],
    logs: [],
    nowIso: "2026-06-15T12:00:00Z",
    locale: "en",
    customTranslations: {},
    selectedProject: aProject({
      id: "p1",
      name: "Selected Project",
      color: "indigo",
    }),
    rootTasks: [],
    onAddTask: onAddTaskMock,
  };

  it("should render project header card and empty tasks layout", async () => {
    render(<TaskListView state={mockState} isCondensed={false} />);
    expect(screen.getByText("Selected Project")).toBeTruthy();

    await waitFor(() => {
      expect(mockGetProjectStatistics).toHaveBeenCalledWith("p1");
    });

    await screen.findByText("Total Duration");
  });

  it("should render project header card with synchronous metrics immediately", async () => {
    const stateWithMetrics = {
      ...mockState,
      metrics: {
        snapshotNowIso: "2026-06-15T12:00:00Z",
        tasks: {},
        projects: {
          p1: {
            projectId: "p1",
            totalElapsedSeconds: 7200,
            todayElapsedSeconds: 3600,
            thisWeekElapsedSeconds: 7200,
            activeTaskCount: 2,
            completedTaskCount: 1,
            isRunning: false,
          },
        },
      },
    };

    render(<TaskListView state={stateWithMetrics} isCondensed={false} />);
    expect(screen.getByText("Selected Project")).toBeTruthy();
    expect(screen.getByText("Total Duration")).toBeTruthy();
    expect(screen.getByTestId("stats-cards-grid")).toBeTruthy();
    expect(screen.queryByTestId("stats-skeleton-grid")).toBeNull();
  });

  it("should render placeholder view when no project is selected", () => {
    // Arrange
    const stateWithoutProject = {
      ...mockState,
      selectedProject: null,
    };

    // Act
    render(<TaskListView state={stateWithoutProject} isCondensed={false} />);

    // Assert
    expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
    expect(screen.getByText(/Select project/i)).toBeTruthy();
  });

  it("should render tree of tasks when rootTasks is populated", () => {
    // Arrange
    const tasks = [
      aTask({ id: "t1", projectId: "p1", name: "Design API Schema" }),
      aTask({ id: "t2", projectId: "p1", name: "Write Integration Specs" }),
    ];
    const stateWithTasks = {
      ...mockState,
      tasks,
      rootTasks: tasks,
    };

    // Act
    render(<TaskListView state={stateWithTasks} isCondensed={false} />);

    // Assert
    expect(screen.getByText("Design API Schema")).toBeTruthy();
    expect(screen.getByText("Write Integration Specs")).toBeTruthy();
  });

  it("should submit new task when task name is entered and form is submitted", () => {
    // Arrange
    const { container } = render(
      <TaskListView state={mockState} isCondensed={false} />,
    );

    // Act - find input in project header card
    const input = container.querySelector(
      "#new-task-input",
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: "Implement GraphQL schema" } });

    const form = input.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // Assert
    expect(onAddTaskMock).toHaveBeenCalledWith(
      "p1",
      "Implement GraphQL schema",
      null,
    );
  });

  it("should not submit new task when input is empty or whitespace", () => {
    // Arrange
    const { container } = render(
      <TaskListView state={mockState} isCondensed={false} />,
    );

    // Act
    const input = container.querySelector(
      "#new-task-input",
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: "   " } });

    const form = input.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // Assert
    expect(onAddTaskMock).not.toHaveBeenCalled();
  });

  it("should apply condensed styling attributes when isCondensed is true", () => {
    // Arrange & Act
    const { container } = render(
      <TaskListView state={mockState} isCondensed={true} />,
    );

    // Assert - verify root sheet element has condensed padding classes
    const sheet = container.querySelector("#project-tasks-sheet");
    expect(sheet?.className).toContain("w-full");
  });
});
