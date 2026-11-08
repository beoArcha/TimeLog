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
import { getMockOXyFlowState, OXyFlowState } from "@tests/shared/test-helpers";
import { TimeLog } from "@bindings/TimeLog";

describe("Unit Tests: TimeLogsTable", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createMockState = (
    customLogs?: TimeLog[],
    overrides?: Partial<OXyFlowState>,
  ): OXyFlowState => ({
    ...getMockOXyFlowState(),
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
    const addBtn = screen.getByRole("button", { name: /Add Log Manually|AddLogManually/i });
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn);

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

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "Updated note reason" } });

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
        "Updated note reason",
        "GUI Edit",
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

    // Act - click edit then provide reason and save without modifying time/note
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "No actual changes made" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(handleEditTimeLog).not.toHaveBeenCalled();
    // Edit mode should close and regular Edit button should be back
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Edit/i })).toBeTruthy();
    });
  });

  it("should not call handleEditTimeLog when saving with empty or whitespace-only reason", async () => {
    // Arrange
    const handleEditTimeLog = vi.fn().mockResolvedValue(undefined);
    const state = createMockState(undefined, { handleEditTimeLog });

    render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Act - click edit, change note, but leave reason empty or pure whitespace
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: "Modified note" } });

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "    " } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert - handleEditTimeLog should not be called and row remains in edit mode
    expect(handleEditTimeLog).not.toHaveBeenCalled();
    expect(reasonInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("should display toast and alert, and retain edit mode when handleEditTimeLog throws an error", async () => {
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

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "Rejection test reason" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Backend persistence failed");
    });
    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.getAttribute("aria-live")).toBe("polite");
    expect(alert.textContent).toContain("Backend persistence failed");
    expect(screen.getByRole("button", { name: /Save/i })).toBeTruthy();
  });

  it("should retain edit mode and show localized SyncErrorReason when handleEditTimeLog returns { saved: true, synchronized: false }", async () => {
    // Arrange
    const handleEditTimeLog = vi
      .fn()
      .mockResolvedValue({ saved: true, synchronized: false });
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
    fireEvent.change(noteInput, { target: { value: "Trigger sync failure" } });

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "Sync test reason" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    const alert = await screen.findByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain("Sync Error");
    expect(screen.getByRole("button", { name: /Save/i })).toBeTruthy();
  });

  it("should retain edit mode and show error when handleEditTimeLog returns { saved: false, synchronized: false }", async () => {
    // Arrange
    const handleEditTimeLog = vi
      .fn()
      .mockResolvedValue({ saved: false, synchronized: false });
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
    fireEvent.change(noteInput, { target: { value: "Trigger unsaved state" } });

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "Unsaved test reason" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    const alert = await screen.findByRole("alert");
    expect(alert).toBeTruthy();
    expect(screen.getByRole("button", { name: /Save/i })).toBeTruthy();
  });

  it("should clear error alert and reset edit mode when cancel is clicked after failure", async () => {
    // Arrange
    const handleEditTimeLog = vi
      .fn()
      .mockRejectedValue(new Error("Transient lock"));
    const state = createMockState(undefined, { handleEditTimeLog });

    render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: "Modified note" } });

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "Temporary reason" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toBeTruthy();

    // Act
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("button", { name: /Edit/i })).toBeTruthy();
    });
  });

  it("should delete log when confirmed by user", async () => {
    // Arrange
    const handleDeleteTimeLog = vi.fn().mockResolvedValue(undefined);
    const state = createMockState(undefined, { handleDeleteTimeLog });

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
      expect(handleDeleteTimeLog).toHaveBeenCalledWith("l1");
    });
  });

  it("should not delete log when confirmation is cancelled", () => {
    // Arrange
    const handleDeleteTimeLog = vi.fn();
    const state = createMockState(undefined, { handleDeleteTimeLog });

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
    expect(handleDeleteTimeLog).not.toHaveBeenCalled();
  });

  it("should add manual log and close form on form submit", async () => {
    // Arrange
    const handleInsertTimeLog = vi.fn().mockResolvedValue(undefined);
    const state = createMockState(undefined, { handleInsertTimeLog });
    const { container } = render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>,
    );

    // Open add log form
    const addBtn = screen.getByRole("button", { name: /Add Log Manually|AddLogManually/i });
    fireEvent.click(addBtn);

    // Fill note and submit
    const noteInput = container.querySelector(
      '#add-log-note',
    ) as HTMLInputElement;
    if (noteInput) {
      fireEvent.change(noteInput, { target: { value: "Manual work entry" } });
    }

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // Assert
    await waitFor(() => {
      expect(handleInsertTimeLog).toHaveBeenCalledWith(
        expect.stringMatching(/^log_man_/),
        "t1",
        expect.any(String),
        expect.any(String),
        "Manual work entry",
      );
    });
  });
});
