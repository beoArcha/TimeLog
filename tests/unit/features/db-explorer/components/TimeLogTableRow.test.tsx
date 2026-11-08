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

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render log row with note", () => {
    // Arrange & Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} />
        </tbody>
      </table>,
    );

    // Assert
    expect(screen.getByText("Initial Note")).toBeTruthy();
  });

  it("should trigger onStartEdit when edit button is clicked", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} />
        </tbody>
      </table>,
    );

    // Act
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    // Assert
    expect(onStartEditMock).toHaveBeenCalledTimes(1);
  });

  it("should allow note editing and saving when isEditing is true", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act
    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: "Updated Note" } });

    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "Fixed typo in note" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSaveEditMock).toHaveBeenCalledWith(
      baseLog.startTime,
      baseLog.endTime,
      "Updated Note",
      "Fixed typo in note",
    );
  });

  it("should trigger onCancelEdit when cancel button is clicked in edit mode", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    expect(onCancelEditMock).toHaveBeenCalledTimes(1);
  });

  it("should trigger onDelete when delete button is clicked", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} />
        </tbody>
      </table>,
    );

    // Act
    const deleteBtn = screen.getByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtn);

    // Assert
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });

  it("should render active tracking label when endTime is null", () => {
    // Arrange
    const activeLog: TimeLog = { ...baseLog, endTime: null };

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} l={activeLog} />
        </tbody>
      </table>,
    );

    // Assert - verify tracking active text is displayed
    expect(screen.getByText(/tracking/i)).toBeTruthy();
  });

  it("should render NoNote fallback when note is null or empty", () => {
    // Arrange
    const logWithoutNote: TimeLog = { ...baseLog, note: null };

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} l={logWithoutNote} />
        </tbody>
      </table>,
    );

    // Assert
    expect(screen.getByText(/no note/i)).toBeTruthy();
  });

  it("should display history toggle button when edit history exists and trigger onToggleHistory", () => {
    // Arrange
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

    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} l={logWithHistory} />
        </tbody>
      </table>,
    );

    // Act
    const historyBtn = screen.getByRole("button", {
      name: /Revision History/i,
    });
    fireEvent.click(historyBtn);

    // Assert
    expect(onToggleHistoryMock).toHaveBeenCalledTimes(1);
  });

  it("should render audit trail row when showHistory is true and editHistory is present", () => {
    // Arrange
    const logWithHistory: TimeLog = {
      ...baseLog,
      editHistory: [
        {
          editedAt: "2026-06-15T14:00:00Z",
          prevStartTime: "2026-06-15T11:00:00Z",
          prevEndTime: "2026-06-15T12:00:00Z",
          prevNote: "Old Note Content",
          reason: "Typo in note",
        },
      ],
    };

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow
            {...mockProps}
            l={logWithHistory}
            showHistory={true}
          />
        </tbody>
      </table>,
    );

    // Assert
    expect(screen.getByText(/Audit Trail/i)).toBeTruthy();
    expect(screen.getByText(/"Old Note Content"/i)).toBeTruthy();
    expect(screen.getByText(/"Typo in note"/i)).toBeTruthy();
  });

  it("should fall back to current startTime when history items have no prevStartTime", () => {
    // Arrange
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

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} l={logWithEmptyHistoryItems} />
        </tbody>
      </table>,
    );

    // Assert - verify the row rendered with original start badge
    expect(screen.getByText(/Original/i)).toBeTruthy();
  });

  it("should render audit source badge when auditSource is present in history", () => {
    // Arrange
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

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow
            {...mockProps}
            l={logWithAuditSource}
            showHistory={true}
          />
        </tbody>
      </table>,
    );

    // Assert
    const badge = screen.getByTestId("audit-source-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("CLI Edit");
  });

  it("should not render audit source badge when auditSource is omitted from history", () => {
    // Arrange
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

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow
            {...mockProps}
            l={logWithoutAuditSource}
            showHistory={true}
          />
        </tbody>
      </table>,
    );

    // Assert
    expect(screen.queryByTestId("audit-source-badge")).toBeNull();
    expect(screen.getByText(/"Legacy edit without source"/i)).toBeTruthy();
  });

  it("should render fallback text in badge when auditSource is an unmapped custom value", () => {
    // Arrange
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

    // Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow
            {...mockProps}
            l={logWithCustomSource}
            showHistory={true}
          />
        </tbody>
      </table>,
    );

    // Assert
    const badge = screen.getByTestId("audit-source-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("ExternalSyncJob");
  });

  it("should initialize reason input with an empty string and not populate with SyncErrorReason", () => {
    // Arrange & Act
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Assert
    const reasonInput = screen.getByLabelText(/Reason/i) as HTMLInputElement;
    expect(reasonInput).toBeTruthy();
    expect(reasonInput.value).toBe("");
    expect(reasonInput.placeholder).toBeTruthy();
    expect(reasonInput.getAttribute("aria-invalid")).toBeNull();
  });

  it("should block save and set aria-invalid when reason is empty", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act - click save with empty reason
    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSaveEditMock).not.toHaveBeenCalled();
    const reasonInput = screen.getByLabelText(/Reason/i);
    expect(reasonInput.getAttribute("aria-invalid")).toBe("true");
    expect(reasonInput.className).toContain("border-destructive");
  });

  it("should block save and set aria-invalid when reason contains only whitespace", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act - type whitespace only
    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "   \t \n  " } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSaveEditMock).not.toHaveBeenCalled();
    expect(reasonInput.getAttribute("aria-invalid")).toBe("true");
    expect(reasonInput.className).toContain("border-destructive");
  });

  it("should clear aria-invalid state when non-empty text is typed into reason", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act - trigger error first
    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    const reasonInput = screen.getByLabelText(/Reason/i);
    expect(reasonInput.getAttribute("aria-invalid")).toBe("true");

    // Type valid reason
    fireEvent.change(reasonInput, { target: { value: "Valid reason" } });

    // Assert
    expect(reasonInput.getAttribute("aria-invalid")).toBeNull();
    expect(reasonInput.className).toContain("border-border");
  });

  it("should trim reason before passing to onSaveEdit", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act
    const reasonInput = screen.getByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: "   Reason with whitespace padding   " } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSaveEditMock).toHaveBeenCalledWith(
      baseLog.startTime,
      baseLog.endTime,
      baseLog.note,
      "Reason with whitespace padding",
    );
  });

  it("should reset reason and clear validation error on cancel", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>,
    );

    // Act - cause validation error
    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    const reasonInput = screen.getByLabelText(/Reason/i);
    expect(reasonInput.getAttribute("aria-invalid")).toBe("true");

    // Click cancel
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    expect(onCancelEditMock).toHaveBeenCalledTimes(1);
    expect(reasonInput.getAttribute("aria-invalid")).toBeNull();
  });
});
