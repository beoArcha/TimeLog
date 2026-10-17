// @vitest-environment jsdom
import React from "react";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import TimeLogsTable from "@features/db-explorer/components/TimeLogsTable";
import { MockProviders } from "@tests/shared/mocks/MockProviders";
import {
  aTimeLog,
  aProject,
  aTask,
} from "@tests/shared/builders/entity-builders";
import { getMockOxyFlowState, OxyFlowState } from "@tests/shared/test-helpers";
import { TimeLog } from "@bindings/TimeLog";
import { PersistenceRouter } from "@common/persistence/PersistenceRouter";

describe("Unit Tests: TimeLogsTable", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createMockState = (
    customLogs?: TimeLog[],
    overrides?: Partial<OxyFlowState>,
  ): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects: [aProject({ id: "p1", name: "Project Alpha" })],
    tasks: [aTask({ id: "t1", projectId: "p1", name: "Task Alpha" })],
    logs: customLogs ?? [
      aTimeLog({
        id: "l1",
        taskId: "t1",
        projectId: "p1",
        note: "Session 1",
        startTime: "2026-06-15T10:00:00Z",
        endTime: "2026-06-15T11:00:00Z",
      }),
    ],
    locale: "en",
    customTranslations: {},
    ...overrides,
  });

  it("should render table headers and realistic log row presentation", () => {
    // Arrange
    const state = createMockState();

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("id")).toBeTruthy();
    expect(screen.getByText("task_id")).toBeTruthy();
    expect(screen.getByText("note")).toBeTruthy();

    expect(screen.getByText("l1")).toBeTruthy();
    expect(screen.getByText("Session 1")).toBeTruthy();

    const table = container.querySelector("table");
    expect(table).not.toBeNull();
  });

  it("should toggle manual add log form when add log button is clicked", () => {
    // Arrange
    const state = createMockState();
    const { container } = render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Act
    const addBtn = container.querySelector("button");
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);

    // Assert
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
  });

  it("should call handleEditTimeLog and reset edit mode when note changes", async () => {
    // Arrange
    const handleEditTimeLog = vi.fn().mockResolvedValue(undefined);
    const state = createMockState(undefined, { handleEditTimeLog });

    render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Act - click edit button on row
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: "Modified session note" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    await waitFor(() => {
      expect(handleEditTimeLog).toHaveBeenCalledWith(
        "l1",
        "t1",
        "2026-06-15T10:00:00Z",
        "2026-06-15T11:00:00Z",
        "Modified session note",
        expect.any(String),
      );
    });
  });

  it("should not call handleEditTimeLog when saving without changes", async () => {
    // Arrange
    const handleEditTimeLog = vi.fn().mockResolvedValue(undefined);
    const state = createMockState(undefined, { handleEditTimeLog });

    render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Act - click edit then immediately save without modifying inputs
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(handleEditTimeLog).not.toHaveBeenCalled();
    // Edit mode should close and regular Edit button should be back
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Edit/i })).toBeTruthy();
    });
  });

  it("should display toast when handleEditTimeLog throws an error", async () => {
    // Arrange
    const handleEditTimeLog = vi
      .fn()
      .mockRejectedValue(new Error("Backend persistence failed"));
    const showToast = vi.fn();
    const state = createMockState(undefined, { handleEditTimeLog, showToast });

    render(
      <MockProviders state={state} windowShellState={{ showToast }}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Act
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: "Trigger rejection" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Backend persistence failed");
    });
  });

  it("should delete log when confirmed by user", async () => {
    // Arrange
    const setLogs = vi.fn();
    const state = createMockState(undefined, { setLogs });

    render(
      <MockProviders state={state}>
        <TimeLogsTable />
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
      expect(setLogs).toHaveBeenCalled();
    });
    const updateFn = setLogs.mock.calls[0][0];
    const initialLogs = [aTimeLog({ id: "l1" }), aTimeLog({ id: "l2" })];
    const filtered = updateFn(initialLogs);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("l2");
  });

  it("should not delete log when confirmation is cancelled", () => {
    // Arrange
    const setLogs = vi.fn();
    const state = createMockState(undefined, { setLogs });

    render(
      <MockProviders state={state}>
        <TimeLogsTable />
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
    expect(setLogs).not.toHaveBeenCalled();
  });

  it("should add manual log and close form on form submit", async () => {
    // Arrange
    const insertSpy = vi
      .spyOn(PersistenceRouter.getInstance().timeLogs, "insert")
      .mockResolvedValue(undefined);
    const setLogs = vi.fn();
    const state = createMockState(undefined, { setLogs });
    const { container } = render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Open add log form
    const addBtn = container.querySelector("button");
    fireEvent.click(addBtn!);

    // Fill note and submit
    const noteInput = container.querySelector(
      'input[placeholder="What were you working on?"]',
    ) as HTMLInputElement;
    if (noteInput) {
      fireEvent.change(noteInput, { target: { value: "Manual work entry" } });
    }

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // Assert
    await waitFor(() => {
      expect(insertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^log_man_/),
        "t1",
        expect.any(String),
      );
      expect(setLogs).toHaveBeenCalled();
    });
    const updater = setLogs.mock.calls[0][0];
    const updated = updater([]);
    expect(updated).toHaveLength(1);
    expect(updated[0].taskId).toBe("t1");
    expect(updated[0].id).toMatch(/^log_man_/);
  });
});
