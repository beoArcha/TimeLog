import { describe, it, expect } from "vitest";
import {
  formatSeconds,
  formatFriendlyDuration,
} from "@features/timelogs/utils/TimelogUtils";

describe("Unit Tests: TimelogUtils", () => {
  it("formatSeconds should format duration as HH:MM:SS", () => {
    expect(formatSeconds(0)).toBe("00:00:00");
    expect(formatSeconds(3665)).toBe("01:01:05");
  });

  it("formatFriendlyDuration should format duration to friendly string", () => {
    expect(formatFriendlyDuration(45)).toBe("45s");
    expect(formatFriendlyDuration(125)).toBe("2m 5s");
    expect(formatFriendlyDuration(3665)).toBe("1h 1m");
  });
});
