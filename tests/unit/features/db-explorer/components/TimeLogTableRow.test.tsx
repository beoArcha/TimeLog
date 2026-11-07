// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import TimeLogTableRow from "@features/db-explorer/components/TimeLogTableRow";
import { TimeLog } from "@bindings/TimeLog";

describe("Unit Tests: TimeLogTableRow", () => {
  const baseLog: TimeLog = {
    id: "l1",
    taskId: "t1",
    projectId: "p1",
    startTime: "2026-06-15T12:00:00Z",
    endTime: "2026-06-15T13:00:00Z",
    note: "Initial Note",
    editHistory: null,
  };

  const onStartEditMock = vi.fn();
  const onSaveEditMock = vi.fn();
  const onCancelEditMock = vi.fn();
  const onDeleteMock = vi.fn();
  const onToggleHistoryMock = vi.fn();

  const mockProps = {
    l: baseLog,
    isEditing: false,
    onStartEdit: onStartEditMock,
    onSaveEdit: onSaveEditMock,
    onCancelEdit: onCancelEditMock,
    onDelete: onDeleteMock,
    locale: "en" as const,
    customTranslations: {},
    showHistory: false,
    onToggleHistory: onToggleHistoryMock,
  };

  const renderRow = (overrides = {}) =>
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} {...overrides} />
        </tbody>
      </table>,
    );

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render log row with note", () => {
    renderRow();
    expect(screen.getByText("Initial Note")).toBeTruthy();
  });

  it("should trigger onStartEdit when edit button is clicked", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    expect(onStartEditMock).toHaveBeenCalledTimes(1);
  });

  it("should initialize reason input as empty by default when isEditing is true", () => {
    renderRow({ isEditing: true });
    const reasonInput = screen.getByLabelText(/Reason/i) as HTMLInputElement;
    expect(reasonInput.value).toBe("");
  });

  it("should block saving and show validation error when reason is empty", () => {
    renderRow({ isEditing: true });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(onSaveEditMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("audit-reason-error")).toBeTruthy();
    const reasonInput = screen.getByLabelText(/Reason/i);
    expect(reasonInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("should block saving and show validation error when reason contains only whitespace", () => {
    renderRow({ isEditing: true });
    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "   \t  " } });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(onSaveEditMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("audit-reason-error")).toBeTruthy();
  });

  it("should allow editing and saving when a valid reason is provided", () => {
    renderRow({ isEditing: true });
    fireEvent.change(screen.getByLabelText(/Note/i), { target: { value: "Updated Note" } });
    fireEvent.change(screen.getByLabelText(/Reason/i), { target: { value: "Manual correction of timing" } });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(onSaveEditMock).toHaveBeenCalledWith(
      baseLog.startTime,
      baseLog.endTime,
      "Updated Note",
      "Manual correction of timing",
    );
  });

  it("should trigger onCancelEdit when cancel button is clicked in edit mode", () => {
    renderRow({ isEditing: true });
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancelEditMock).toHaveBeenCalledTimes(1);
  });

  it("should trigger onDelete when delete button is clicked", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });

  it("should render active tracking label when endTime is null", () => {
    renderRow({ l: { ...baseLog, endTime: null } });
    expect(screen.getByText(/tracking/i)).toBeTruthy();
  });

  it("should render NoNote fallback when note is null or empty", () => {
    renderRow({ l: { ...baseLog, note: null } });
    expect(screen.getByText(/no note/i)).toBeTruthy();
  });

  it("should display history toggle button when edit history exists and trigger onToggleHistory", () => {
    const logWithHistory: TimeLog = {
      ...baseLog,
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "2026-06-15T11:00:00Z",
          prevEndTime: "2026-06-15T12:00:00Z",
          prevNote: "Original note",
          reason: "Manual correction",
        },
      ],
    };

    renderRow({ l: logWithHistory });
    fireEvent.click(screen.getByRole("button", { name: /Revision History/i }));
    expect(onToggleHistoryMock).toHaveBeenCalledTimes(1);
  });

  it("should render audit trail row when showHistory is true and editHistory is present", () => {
    const logWithHistory: TimeLog = {
      ...baseLog,
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "2026-06-15T11:00:00Z",
          prevEndTime: "2026-06-15T12:00:00Z",
          prevNote: "Old Note Content",
          reason: "User specified reason",
        },
      ],
    };

    renderRow({ l: logWithHistory, showHistory: true });
    expect(screen.getByText(/Audit Trail/i)).toBeTruthy();
    expect(screen.getByText(/"Old Note Content"/i)).toBeTruthy();
    expect(screen.getByText(/"User specified reason"/i)).toBeTruthy();
  });

  it("should fall back to current startTime when history items have no prevStartTime", () => {
    const logWithEmptyHistoryItems: TimeLog = {
      ...baseLog,
      startTime: "2026-06-15T09:00:00Z",
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "" as unknown as string,
          prevEndTime: null,
          prevNote: "Note only",
          reason: "Changed note",
        },
      ],
    };

    renderRow({ l: logWithEmptyHistoryItems });
    expect(screen.getByText(/Original/i)).toBeTruthy();
  });

  it("should render audit source badge when auditSource is present in history", () => {
    const logWithAuditSource: TimeLog = {
      ...baseLog,
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "2026-06-15T11:00:00Z",
          prevEndTime: "2026-06-15T12:00:00Z",
          prevNote: "Prev Note",
          reason: "CLI batch correction",
          auditSource: "CLI Edit",
        },
      ],
    };

    renderRow({ l: logWithAuditSource, showHistory: true });
    const badge = screen.getByTestId("audit-source-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("CLI Edit");
  });

  it("should not render audit source badge when auditSource is omitted from history", () => {
    const logWithoutAuditSource: TimeLog = {
      ...baseLog,
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "2026-06-15T11:00:00Z",
          prevEndTime: "2026-06-15T12:00:00Z",
          prevNote: "Legacy Note",
          reason: "Legacy edit without source",
        },
      ],
    };

    renderRow({ l: logWithoutAuditSource, showHistory: true });
    expect(screen.queryByTestId("audit-source-badge")).toBeNull();
    expect(screen.getByText(/"Legacy edit without source"/i)).toBeTruthy();
  });

  it("should render fallback text in badge when auditSource is an unmapped custom value", () => {
    const logWithCustomSource: TimeLog = {
      ...baseLog,
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "2026-06-15T11:00:00Z",
          prevEndTime: "2026-06-15T12:00:00Z",
          prevNote: "Custom note",
          reason: "Custom import",
          auditSource: "ExternalSyncJob",
        },
      ],
    };

    renderRow({ l: logWithCustomSource, showHistory: true });
    const badge = screen.getByTestId("audit-source-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("ExternalSyncJob");
  });
});
