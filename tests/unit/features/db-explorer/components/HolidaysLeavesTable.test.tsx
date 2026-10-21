import { MockProviders } from "@tests/shared/mocks/MockProviders";
// @vitest-environment jsdom
import React from "react";
import { render, fireEvent, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import HolidaysLeavesTable from "@features/db-explorer/components/HolidaysLeavesTable";
import { getMockOxyFlowState, OxyFlowState } from "@tests/shared/test-helpers";
import { HolidayLeave } from "@bindings/HolidayLeave";

describe("Unit Tests: HolidaysLeavesTable", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const getMockHolidays = (): HolidayLeave[] => [
    {
      id: "hol_1",
      date: "2026-07-20",
      type: "holiday",
      name: "Summer Holiday",
    },
    {
      id: "hol_2",
      date: "2026-08-15",
      type: "leave",
      name: "Vacation Leave",
      originalName: "Old Vacation",
      originalDate: "2026-08-14",
      originalType: "holiday",
      editHistory: [
        {
          editedAt: "2026-07-01T10:00:00Z",
          prevName: "Old Vacation",
          prevDate: "2026-08-14",
          prevType: "holiday",
          reason: "Initial adjustment",
        },
      ],
    },
  ];

  it("should render holidays list table in default theme", () => {
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      resolvedTheme: "dark",
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    expect(within(container).getByText("Summer Holiday")).not.toBeNull();
    expect(within(container).getByText("Vacation Leave")).not.toBeNull();
  });

  it("should render correctly in light theme and high-contrast theme", () => {
    const mockStateLight: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      resolvedTheme: "light",
    };

    const { container, rerender } = render(
      <MockProviders state={mockStateLight}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    expect(within(container).getByText("Summer Holiday")).not.toBeNull();

    const mockStateHighContrast: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      resolvedTheme: "high-contrast",
    };

    rerender(
      <MockProviders state={mockStateHighContrast}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    expect(within(container).getByText("Summer Holiday")).not.toBeNull();
  });

  it("should add a new holiday entity on clicking add button", () => {
    const handleAddHolidayMock = vi.fn();
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      handleAddHoliday: handleAddHolidayMock,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const addButtons = within(container).getAllByRole("button", {
      name: /Add Leave/i,
    });
    const realAddButton = addButtons.find((b) => b.tagName === "BUTTON")!;
    fireEvent.click(realAddButton);

    expect(handleAddHolidayMock).toHaveBeenCalledTimes(1);
    expect(handleAddHolidayMock).toHaveBeenCalledWith(
      expect.any(String),
      "holiday",
      "New Holiday / Day Off",
    );
  });

  it("should start editing, modify values, and save holiday with audit history update", () => {
    const handleUpdateHolidayMock = vi.fn();
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      handleUpdateHoliday: handleUpdateHolidayMock,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row0 = container.querySelectorAll("tbody tr")[0];
    const editBtn = row0.querySelector(".lucide-pen-line")?.closest("button");
    expect(editBtn).not.toBeNull();
    if (editBtn) fireEvent.click(editBtn);

    const dateInput = container.querySelector(
      'input[value="2026-07-20"]',
    ) as HTMLInputElement;
    const nameInput = container.querySelector(
      'input[value="Summer Holiday"]',
    ) as HTMLInputElement;
    const reasonInput = container.querySelector(
      'input[aria-label="Reason for modification:"]',
    ) as HTMLInputElement;
    const typeSelect = container.querySelector("select") as HTMLSelectElement;

    expect(dateInput).not.toBeNull();
    expect(nameInput).not.toBeNull();
    expect(reasonInput).not.toBeNull();
    expect(typeSelect).not.toBeNull();

    fireEvent.change(dateInput, { target: { value: "2026-07-21" } });
    fireEvent.change(nameInput, { target: { value: "Updated Holiday" } });
    fireEvent.change(reasonInput, { target: { value: "Shifted date" } });
    fireEvent.change(typeSelect, { target: { value: "leave" } });

    const checkBtn = container
      .querySelectorAll("tbody tr")[0]
      .querySelector(".lucide-check")
      ?.closest("button");
    expect(checkBtn).not.toBeNull();
    if (checkBtn) fireEvent.click(checkBtn);

    expect(handleUpdateHolidayMock).toHaveBeenCalledTimes(1);
    expect(handleUpdateHolidayMock).toHaveBeenCalledWith(
      "hol_1",
      "2026-07-21",
      "leave",
      "Updated Holiday",
      "Shifted date",
    );
  });

  it("should cancel edit on clicking cancel (X) button", () => {
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row0 = container.querySelectorAll("tbody tr")[0];
    const editBtn = row0.querySelector(".lucide-pen-line")?.closest("button");
    if (editBtn) fireEvent.click(editBtn);

    expect(
      container.querySelector('input[aria-label="Reason for modification:"]'),
    ).not.toBeNull();

    const xBtn = container
      .querySelectorAll("tbody tr")[0]
      .querySelector(".lucide-x")
      ?.closest("button");
    if (xBtn) fireEvent.click(xBtn);

    expect(
      container.querySelector('input[aria-label="Reason for modification:"]'),
    ).toBeNull();
  });

  it("should close editing without modifying if no changes made when saving", () => {
    const handleUpdateHolidayMock = vi.fn();
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      handleUpdateHoliday: handleUpdateHolidayMock,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row0 = container.querySelectorAll("tbody tr")[0];
    const editBtn = row0.querySelector(".lucide-pen-line")?.closest("button");
    if (editBtn) fireEvent.click(editBtn);

    const checkBtn = container
      .querySelectorAll("tbody tr")[0]
      .querySelector(".lucide-check")
      ?.closest("button");
    if (checkBtn) fireEvent.click(checkBtn);

    expect(handleUpdateHolidayMock).not.toHaveBeenCalled();
  });

  it("should append to existing edit history when editing a record that already has history", () => {
    const handleUpdateHolidayMock = vi.fn();
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      handleUpdateHoliday: handleUpdateHolidayMock,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row1 = container.querySelectorAll("tbody tr")[1]; // hol_2
    const editBtn = row1.querySelector(".lucide-pen-line")?.closest("button");
    expect(editBtn).not.toBeNull();
    if (editBtn) fireEvent.click(editBtn);

    const nameInput = container.querySelector(
      'input[value="Vacation Leave"]',
    ) as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    fireEvent.change(nameInput, { target: { value: "New Vacation Leave" } });

    const reasonInput = container.querySelector(
      'input[aria-label="Reason for modification:"]',
    ) as HTMLInputElement;
    if (reasonInput)
      fireEvent.change(reasonInput, {
        target: { value: "Calendar adjustment" },
      });

    const checkBtn = container
      .querySelectorAll("tbody tr")[1]
      .querySelector(".lucide-check")
      ?.closest("button");
    expect(checkBtn).not.toBeNull();
    if (checkBtn) fireEvent.click(checkBtn);

    expect(handleUpdateHolidayMock).toHaveBeenCalledTimes(1);
    expect(handleUpdateHolidayMock).toHaveBeenCalledWith(
      "hol_2",
      "2026-08-15",
      "leave",
      "New Vacation Leave",
      "Calendar adjustment",
    );
  });

  it("should delete a holiday when clicking delete button and confirming in dialog", () => {
    const handleDeleteHolidayMock = vi.fn();
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      handleDeleteHoliday: handleDeleteHolidayMock,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row0 = container.querySelectorAll("tbody tr")[0];
    const deleteBtn = row0.querySelector(".lucide-trash-2")?.closest("button");
    expect(deleteBtn).not.toBeNull();
    if (deleteBtn) fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole("button", {
      name: /Delete/i,
    });
    fireEvent.click(confirmBtn);

    expect(handleDeleteHolidayMock).toHaveBeenCalledTimes(1);
    expect(handleDeleteHolidayMock).toHaveBeenCalledWith("hol_1");
  });

  it("should toggle history details row when clicking history icon button", () => {
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row1 = container.querySelectorAll("tbody tr")[1];
    const historyBtn = row1.querySelector(".lucide-history")?.closest("button");
    expect(historyBtn).not.toBeNull();
    if (historyBtn) fireEvent.click(historyBtn);

    expect(within(container).getByText(/Audit Trail/i)).not.toBeNull();
    expect(within(container).getByText(/Initial adjustment/i)).not.toBeNull();

    if (historyBtn) fireEvent.click(historyBtn);
    expect(within(container).queryByText(/Audit Trail/i)).toBeNull();
  });

  it("should save edit with default reason when reason input is cleared to empty string", () => {
    const handleUpdateHolidayMock = vi.fn();
    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: getMockHolidays(),
      handleUpdateHoliday: handleUpdateHolidayMock,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    const row0 = container.querySelectorAll("tbody tr")[0];
    const editBtn = row0.querySelector(".lucide-pen-line")?.closest("button");
    if (editBtn) fireEvent.click(editBtn);

    const reasonInput = container.querySelector(
      'input[aria-label="Reason for modification:"]',
    ) as HTMLInputElement;
    fireEvent.change(reasonInput, { target: { value: "" } });

    const nameInput = container.querySelector(
      'input[value="Summer Holiday"]',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Changed Holiday Name" } });

    const checkBtn = container
      .querySelectorAll("tbody tr")[0]
      .querySelector(".lucide-check")
      ?.closest("button");
    if (checkBtn) fireEvent.click(checkBtn);

    expect(handleUpdateHolidayMock).toHaveBeenCalledTimes(1);
    expect(handleUpdateHolidayMock).toHaveBeenCalledWith(
      "hol_1",
      "2026-07-20",
      "holiday",
      "Changed Holiday Name",
      "",
    );
  });

  it("should render original name fallback when originalName is missing but originalDate exists", () => {
    const holidaysWithMissingOriginalName: HolidayLeave[] = [
      {
        id: "hol_3",
        date: "2026-09-01",
        type: "holiday",
        name: "Autumn Day",
        originalDate: "2026-09-02",
      },
    ];

    const mockState: OxyFlowState = {
      ...getMockOxyFlowState(),
      holidays: holidaysWithMissingOriginalName,
    };

    const { container } = render(
      <MockProviders state={mockState}>
        <HolidaysLeavesTable />
      </MockProviders>,
    );

    expect(
      within(container).getByText(
        /Original:\s*Autumn Day\s*\(\s*2026-09-02\s*\)/,
      ),
    ).not.toBeNull();
  });
});
