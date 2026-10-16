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

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSaveEditMock).toHaveBeenCalledWith(
      baseLog.startTime,
      baseLog.endTime,
      "Updated Note",
      expect.any(String),
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
});
