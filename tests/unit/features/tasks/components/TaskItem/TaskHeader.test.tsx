// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TaskHeader } from "@features/tasks/components/TaskItem/TaskHeader";
import { aTask } from "@tests/shared/builders/entity-builders";
import { TaskEditingProvider } from "@features/tasks/context/TaskEditingContext";
import { MockDataProvider } from "@tests/shared/mocks/MockProviders";
import type { DataState } from "@common/hooks/DataContext";

describe("Unit Tests: TaskHeader", () => {
  const onToggleTaskCompleteMock = vi.fn();
  const onUpdateTaskMock = vi.fn();
  const setEditingIdMock = vi.fn();
  const setEditNameMock = vi.fn();

  const mockProps = {
    rootTask: aTask({
      id: "t1",
      projectId: "p1",
      name: "Task Header Title",
      completed: false,
      status: "Todo",
      parentTaskId: null,
    }),
    isCurrentRunning: false,
    isChildRunning: false,
    runningSubtask: undefined,
    editingId: null,
    editName: "",
    onToggleTaskComplete: onToggleTaskCompleteMock,
    onRenameTask: vi.fn(),
    onUpdateTask: onUpdateTaskMock,
    onDeleteTask: vi.fn(),
    setEditingId: setEditingIdMock,
    setEditName: setEditNameMock,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("should render task name and trigger toggle complete checkbox", () => {
    // Arrange & Act
    render(<TaskHeader {...mockProps} />);

    // Assert
    expect(screen.getByText("Task Header Title")).toBeTruthy();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith("t1");
  });

  it("should trigger onUpdateTask when status select value changes", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskHeader {...mockProps} />);

    // Act - open select popup and select option
    const selectTrigger = screen.getByLabelText(/Task status/i);
    await user.click(selectTrigger);

    const inProgressOption = await screen.findByRole("option", { name: /In Progress/i });
    await user.click(inProgressOption);

    // Assert
    expect(onUpdateTaskMock).toHaveBeenCalledWith(
      "t1",
      "Task Header Title",
      null,
      "InProgress",
      null,
    );
  });

  it("should display active running indicator badge when isCurrentRunning is true", () => {
    // Arrange & Act
    render(<TaskHeader {...mockProps} isCurrentRunning={true} />);

    // Assert
    expect(screen.getByText(/In Progress/i)).toBeTruthy();
  });

  it("should display running subtask indicator badge when isChildRunning is true", () => {
    // Arrange
    const subtask = aTask({
      id: "sub-1",
      name: "Background indexing",
      parentTaskId: "t1",
    });

    // Act
    render(
      <TaskHeader
        {...mockProps}
        isChildRunning={true}
        runningSubtask={subtask}
      />,
    );

    // Assert
    expect(screen.getByText(/Background indexing/i)).toBeTruthy();
  });

  it("should render TaskNameEditor instead of title when task is being edited", () => {
    // Arrange & Act
    render(
      <TaskHeader {...mockProps} editingId="t1" editName="Editing Title" />,
    );

    // Assert - TaskNameEditor renders an input
    const editorInput = screen.getByDisplayValue("Editing Title");
    expect(editorInput).toBeTruthy();
  });

  it("should resolve fallback handlers from context when callbacks are omitted from props", () => {
    // Arrange
    const handleToggleTaskComplete = vi.fn();
    const handleUpdateTask = vi.fn();

    render(
      <MockDataProvider
        value={{ handleToggleTaskComplete, handleUpdateTask } as unknown as Partial<DataState>}
      >
        <TaskEditingProvider>
          <TaskHeader
            rootTask={mockProps.rootTask}
            isCurrentRunning={false}
            isChildRunning={false}
            runningSubtask={undefined}
          />
        </TaskEditingProvider>
      </MockDataProvider>,
    );

    // Act
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Assert
    expect(handleToggleTaskComplete).toHaveBeenCalledWith("t1");
  });
});
