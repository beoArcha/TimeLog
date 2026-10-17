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
import PatchLogsTable from "@features/db-explorer/components/PatchLogsTable";
import { MockProviders } from "@tests/shared/mocks/MockProviders";
import { aPatchLog, aProject } from "@tests/shared/builders/entity-builders";
import { getMockOxyFlowState, OxyFlowState } from "@tests/shared/test-helpers";
import { PatchLog } from "@bindings/PatchLog";

describe("Unit Tests: PatchLogsTable", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createMockState = (
    patches: PatchLog[],
    overrides?: Partial<OxyFlowState>,
  ): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects: [aProject({ id: "p1", name: "Project Alpha" })],
    patches,
    locale: "en",
    customTranslations: {},
    ...overrides,
  });

  it("should render applied patches table with standard patch data", () => {
    // Arrange
    const patch = aPatchLog({
      id: "pat_1",
      projectId: "p1",
      patchNote: "Initial Setup schema patch",
      isSystemEvent: false,
    });
    const state = createMockState([patch]);

    // Act
    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("pat_1")).toBeTruthy();
    expect(screen.getByText(/Initial Setup schema patch/)).toBeTruthy();
    expect(screen.queryByText("[SYSTEM]")).toBeNull();
  });

  it("should display [SYSTEM] indicator badge when patch is marked as system event", () => {
    // Arrange
    const systemPatch = aPatchLog({
      id: "pat_sys_1",
      projectId: "p1",
      patchNote: "Auto sleep compensation",
      isSystemEvent: true,
    });
    const state = createMockState([systemPatch]);

    // Act
    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("pat_sys_1")).toBeTruthy();
    expect(screen.getByText(/Auto sleep compensation/)).toBeTruthy();
    expect(screen.getByText("[SYSTEM]")).toBeTruthy();
  });

  it("should render empty state message row when patches list is empty", () => {
    // Arrange
    const state = createMockState([]);

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Assert
    expect(screen.getByText("id")).toBeTruthy();
    expect(screen.getByText("project_id")).toBeTruthy();
    const emptyCell = container.querySelector('tbody td[colspan="7"]');
    expect(emptyCell).not.toBeNull();
    expect(emptyCell?.textContent).toContain("patch_logs");
  });

  it("should open modal and add a manual patch log when form is submitted", async () => {
    // Arrange
    const setPatches = vi.fn();
    const state = createMockState([], { setPatches });

    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Act - open modal
    const addBtn = screen.getByText(/Add Manual Patch/i).closest("button");
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);

    // Modal dialog should be in document
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Fill note and submit
    const noteInput = screen.getByLabelText(/Patch Note|Reason/i);
    fireEvent.change(noteInput, { target: { value: "Sleep gap patch" } });

    const submitBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(submitBtn);

    // Assert
    expect(setPatches).toHaveBeenCalled();
    const updater = setPatches.mock.calls[0][0];
    const updated = updater([]);
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toMatch(/^patch_/);
    expect(updated[0].patchNote).toBe("Sleep gap patch");
    expect(updated[0].projectId).toBe("p1");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("should close modal when Cancel button is clicked", async () => {
    // Arrange
    const state = createMockState([]);
    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Act - open then cancel
    const addBtn = screen.getByText(/Add Manual Patch/i).closest("button");
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);
    expect(screen.getByRole("dialog")).toBeTruthy();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("should close modal when Close (X) button is clicked", async () => {
    // Arrange
    const state = createMockState([]);
    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Act - open then click Close (X)
    const addBtn = screen.getByText(/Add Manual Patch/i).closest("button");
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);
    expect(screen.getByRole("dialog")).toBeTruthy();

    const closeBtn = screen.getByRole("button", { name: /Close/i });
    fireEvent.click(closeBtn);

    // Assert
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("should not add patch when projects list is empty", () => {
    // Arrange
    const setPatches = vi.fn();
    const state = createMockState([], { projects: [], setPatches });

    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>,
    );

    // Act - open modal and submit
    const addBtn = screen.getByText(/Add Manual Patch/i).closest("button");
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);

    const submitBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(submitBtn);

    // Assert - no patch added
    expect(setPatches).not.toHaveBeenCalled();
  });

  it("should delete patch when user confirms", async () => {
    // Arrange
    const setPatches = vi.fn();
    const patch = aPatchLog({ id: "pat_to_delete" });
    const state = createMockState([patch], { setPatches });

    render(
      <MockProviders state={state}>
        <PatchLogsTable />
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
      expect(setPatches).toHaveBeenCalled();
    });
    const updater = setPatches.mock.calls[0][0];
    const filtered = updater([patch]);
    expect(filtered).toHaveLength(0);
  });

  it("should not delete patch when user cancels confirmation", () => {
    // Arrange
    const setPatches = vi.fn();
    const patch = aPatchLog({ id: "pat_stay" });
    const state = createMockState([patch], { setPatches });

    render(
      <MockProviders state={state}>
        <PatchLogsTable />
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
    expect(setPatches).not.toHaveBeenCalled();
  });
});
