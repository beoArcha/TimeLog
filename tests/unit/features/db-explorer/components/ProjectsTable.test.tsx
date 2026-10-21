// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import ProjectsTable from "@features/db-explorer/components/ProjectsTable";
import { MockProviders } from "@tests/shared/mocks/MockProviders";
import {
  aProject,
  aTask,
  aTimeLog,
} from "@tests/shared/builders/entity-builders";
import { getMockOxyFlowState, OxyFlowState } from "@tests/shared/test-helpers";
import { Project } from "@bindings/Project";

describe("Unit Tests: ProjectsTable", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createMockState = (
    projects: Project[],
    overrides?: Partial<OxyFlowState>,
  ): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects,
    tasks: [
      aTask({
        id: "t1",
        projectId: projects[0]?.id ?? "p1",
        name: "Task Alpha",
      }),
    ],
    logs: [
      aTimeLog({ id: "l1", projectId: projects[0]?.id ?? "p1", taskId: "t1" }),
    ],
    locale: "en",
    customTranslations: {},
    ...overrides,
  });

  it("should render projects list with project details", () => {
    // Arrange
    const project = aProject({
      id: "p1",
      name: "Project Titan",
      color: "indigo",
    });
    const state = createMockState([project]);

    // Act
    render(
      <MockProviders state={state}>
        <ProjectsTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("p1")).toBeTruthy();
    expect(screen.getByText("Project Titan")).toBeTruthy();
    expect(screen.getByText(/indigo/i)).toBeTruthy();
  });

  it("should open edit form, update project name, and handle save with history tracking", () => {
    // Arrange
    const setProjects = vi.fn();
    const project = aProject({
      id: "p1",
      name: "Initial Name",
      color: "violet",
    });
    const state = createMockState([project], { setProjects });

    render(
      <MockProviders state={state}>
        <ProjectsTable />
      </MockProviders>,
    );

    // Act - open edit
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const nameInput = screen.getByLabelText(/Project Name/i);
    fireEvent.change(nameInput, { target: { value: "Renamed Titan" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(setProjects).toHaveBeenCalled();
    const updater = setProjects.mock.calls[0][0];
    const updated = updater([project]);
    expect(updated[0].name).toBe("Renamed Titan");
    expect(updated[0].originalName).toBe("Initial Name");
    expect(updated[0].editHistory).toHaveLength(1);
    expect(updated[0].editHistory![0].prevName).toBe("Initial Name");
  });

  it("should not update project or editHistory when saving without modifications", () => {
    // Arrange
    const setProjects = vi.fn();
    const project = aProject({
      id: "p1",
      name: "Static Name",
      color: "violet",
    });
    const state = createMockState([project], { setProjects });

    render(
      <MockProviders state={state}>
        <ProjectsTable />
      </MockProviders>,
    );

    // Act - open edit and save without changing
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(setProjects).toHaveBeenCalled();
    const updater = setProjects.mock.calls[0][0];
    const updated = updater([project]);
    expect(updated[0].name).toBe("Static Name");
    expect(updated[0].editHistory).toBeUndefined();
  });

  it("should exit editing mode when cancel button is clicked", () => {
    // Arrange
    const project = aProject({ id: "p1", name: "Editable Name" });
    const state = createMockState([project]);

    render(
      <MockProviders state={state}>
        <ProjectsTable />
      </MockProviders>,
    );

    // Act - open edit then cancel
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);
    expect(screen.getByLabelText(/Project Name/i)).toBeTruthy();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert - input should be gone, edit button should be back
    expect(screen.queryByLabelText(/Project Name/i)).toBeNull();
    expect(screen.getByRole("button", { name: /Edit/i })).toBeTruthy();
  });

  it("should delete project, tasks, and logs when confirmed by user", async () => {
    // Arrange
    const setProjects = vi.fn();
    const setTasks = vi.fn();
    const setLogs = vi.fn();
    const project = aProject({ id: "p1" });
    const state = createMockState([project], {
      setProjects,
      setTasks,
      setLogs,
    });

    render(
      <MockProviders state={state}>
        <ProjectsTable />
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
      expect(setProjects).toHaveBeenCalled();
      expect(setTasks).toHaveBeenCalled();
      expect(setLogs).toHaveBeenCalled();
    });

    // Verify filter logic
    const projectFilter = setProjects.mock.calls[0][0];
    expect(projectFilter([project])).toHaveLength(0);

    const taskFilter = setTasks.mock.calls[0][0];
    expect(
      taskFilter([aTask({ projectId: "p1" }), aTask({ projectId: "p2" })]),
    ).toHaveLength(1);

    const logFilter = setLogs.mock.calls[0][0];
    expect(
      logFilter([aTimeLog({ projectId: "p1" }), aTimeLog({ projectId: "p2" })]),
    ).toHaveLength(1);
  });

  it("should not delete project when user cancels confirmation", () => {
    // Arrange
    const setProjects = vi.fn();
    const project = aProject({ id: "p1" });
    const state = createMockState([project], { setProjects });

    render(
      <MockProviders state={state}>
        <ProjectsTable />
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
    expect(setProjects).not.toHaveBeenCalled();
  });

  it("should toggle and render revision history audit trail", () => {
    // Arrange
    const projectWithHistory = aProject({
      id: "p1",
      name: "Current Name",
      originalName: "Historic Name",
      editHistory: [
        {
          editedAt: "2026-06-15T12:00:00Z",
          prevName: "Old Project Name",
          prevColor: "rose",
          reason: "Rebranding initiative",
        },
      ],
    });
    const state = createMockState([projectWithHistory]);

    render(
      <MockProviders state={state}>
        <ProjectsTable />
      </MockProviders>,
    );

    // Act - click history toggle
    const historyBtn = screen.getByRole("button", {
      name: /Revision History/i,
    });
    fireEvent.click(historyBtn);

    // Assert
    expect(screen.getByText(/Audit Trail/i)).toBeTruthy();
    expect(screen.getByText(/"Old Project Name"/i)).toBeTruthy();
    expect(screen.getByText(/"Rebranding initiative"/i)).toBeTruthy();

    // Toggle off
    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Audit Trail/i)).toBeNull();
  });
});
