// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import TasksTable from "@features/db-explorer/components/TasksTable";
import { MockProviders } from "@tests/shared/mocks/MockProviders";
import {
  aTask,
  aProject,
  aTimeLog,
} from "@tests/shared/builders/entity-builders";
import { getMockOxyFlowState, OxyFlowState } from "@tests/shared/test-helpers";
import { Task } from "@bindings/Task";

describe("Unit Tests: TasksTable", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createMockState = (
    tasks: Task[],
    overrides?: Partial<OxyFlowState>,
  ): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects: [aProject({ id: "p1", name: "Project Alpha" })],
    tasks,
    logs: [aTimeLog({ id: "l1", taskId: tasks[0]?.id ?? "t1" })],
    locale: "en",
    customTranslations: {},
    ...overrides,
  });

  it("should render tasks list with completed TRUE and FALSE badges", () => {
    // Arrange
    const taskPending = aTask({
      id: "t1",
      name: "Pending Task",
      completed: false,
    });
    const taskDone = aTask({ id: "t2", name: "Done Task", completed: true });
    const state = createMockState([taskPending, taskDone]);

    // Act
    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("Pending Task")).toBeTruthy();
    expect(screen.getByText("Done Task")).toBeTruthy();
    expect(screen.getByText("FALSE")).toBeTruthy();
    expect(screen.getByText("TRUE")).toBeTruthy();
  });

  it("should open edit form, modify task name, and save with audit history", () => {
    // Arrange
    const handleUpdateTask = vi.fn().mockResolvedValue(undefined);
    const task = aTask({ id: "t1", name: "Task Initial", completed: false });
    const state = createMockState([task], { handleUpdateTask });

    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Act - click edit
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const nameInput = screen.getByLabelText(/Task Name/i);
    fireEvent.change(nameInput, { target: { value: "Task Completed Now" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(handleUpdateTask).toHaveBeenCalledWith("t1", {
      name: "Task Completed Now",
      completed: false,
    });
  });

  it("should not update task or editHistory when saving without modifications", () => {
    // Arrange
    const handleUpdateTask = vi.fn().mockResolvedValue(undefined);
    const task = aTask({ id: "t1", name: "Unchanged Task", completed: false });
    const state = createMockState([task], { handleUpdateTask });

    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Act - click edit and save immediately
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(handleUpdateTask).not.toHaveBeenCalled();
  });

  it("should exit editing mode when cancel button is clicked", () => {
    // Arrange
    const task = aTask({ id: "t1", name: "Task One" });
    const state = createMockState([task]);

    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Act - open edit then cancel
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);
    expect(screen.getByLabelText(/Task Name/i)).toBeTruthy();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    expect(screen.queryByLabelText(/Task Name/i)).toBeNull();
    expect(screen.getByRole("button", { name: /Edit/i })).toBeTruthy();
  });

  it("should delete task and associated logs when confirmed by user", async () => {
    // Arrange
    const handleDeleteTask = vi.fn().mockResolvedValue(undefined);
    const task = aTask({ id: "t1" });
    const state = createMockState([task], { handleDeleteTask });

    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Act
    const deleteBtn = screen.getByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole("button", { name: /Delete/i });
    fireEvent.click(confirmBtn);

    // Assert
    await waitFor(() => {
      expect(handleDeleteTask).toHaveBeenCalledWith("t1");
    });
  });

  it("should not delete task when user cancels confirmation", () => {
    // Arrange
    const setTasks = vi.fn();
    const task = aTask({ id: "t1" });
    const state = createMockState([task], { setTasks });

    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Act
    const deleteBtn = screen.getByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const cancelBtn = within(dialog as HTMLElement).getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    expect(setTasks).not.toHaveBeenCalled();
  });

  it("should toggle and render revision history audit trail", () => {
    // Arrange
    const taskWithHistory = aTask({
      id: "t1",
      name: "Refactored Task",
      originalName: "Original Task Name",
      editHistory: [
        {
          editedAt: "2026-06-15T12:00:00Z",
          prevName: "Old Task Name",
          prevCompleted: false,
          reason: "Clarified title",
        },
      ],
    });
    const state = createMockState([taskWithHistory]);

    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Act - click history toggle
    const historyBtn = screen.getByRole("button", {
      name: /Revision History/i,
    });
    fireEvent.click(historyBtn);

    // Assert
    expect(screen.getByText(/Audit Trail/i)).toBeTruthy();
    expect(screen.getByText(/"Old Task Name"/i)).toBeTruthy();
    expect(screen.getByText(/"Clarified title"/i)).toBeTruthy();

    // Toggle off
    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Audit Trail/i)).toBeNull();
  });

  it("should render headers without crashing when tasks list is empty", () => {
    // Arrange
    const state = createMockState([]);

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("id")).toBeTruthy();
    expect(screen.getByText("name")).toBeTruthy();
    expect(container.querySelector('[data-slot="empty-state"]')).toBeTruthy();
  });
});
