import { describe, it, expect } from "vitest";
import {
  formatSeconds,
  formatFriendlyDuration,
} from "@/src/features/timelogs/utils/TimelogUtils";

describe("Unit Tests: Time Calculations", () => {
  describe("formatSeconds", () => {
    it("should_format_seconds_cleanly_as_HH_MM_SS_when_various_durations_are_provided", () => {
      expect(formatSeconds(0)).toBe("00:00:00");
      expect(formatSeconds(45)).toBe("00:00:45");
      expect(formatSeconds(60)).toBe("00:01:00");
      expect(formatSeconds(75)).toBe("00:01:15");
      expect(formatSeconds(59 * 60 + 59)).toBe("00:59:59");
      expect(formatSeconds(3600)).toBe("01:00:00");
      expect(formatSeconds(3665)).toBe("01:01:05");
      expect(formatSeconds(10 * 3600 + 45 * 60 + 12)).toBe("10:45:12");
    });

    it("should_handle_large_second_limits_when_formatting_seconds", () => {
      expect(formatSeconds(99 * 3600 + 59 * 60 + 59)).toBe("99:59:59");
    });
  });

  describe("formatFriendlyDuration", () => {
    it("should_return_seconds_format_when_under_one_minute", () => {
      expect(formatFriendlyDuration(0)).toBe("0s");
      expect(formatFriendlyDuration(59)).toBe("59s");
    });

    it("should_return_minutes_and_seconds_when_under_one_hour", () => {
      expect(formatFriendlyDuration(60)).toBe("1m 0s");
      expect(formatFriendlyDuration(125)).toBe("2m 5s");
    });

    it("should_return_hours_and_minutes_when_starting_from_one_hour", () => {
      expect(formatFriendlyDuration(3600)).toBe("1h 0m");
      expect(formatFriendlyDuration(3660)).toBe("1h 1m");
      expect(formatFriendlyDuration(7380)).toBe("2h 3m");
    });

    it("should_handle_exactly_sixty_seconds_when_formatting_friendly_duration", () => {
      expect(formatFriendlyDuration(60)).toBe("1m 0s");
    });

    it("should_handle_exactly_one_hour_when_formatting_friendly_duration", () => {
      expect(formatFriendlyDuration(3600)).toBe("1h 0m");
    });

    it("should_handle_extremely_large_durations_flawlessly_when_formatting_friendly_duration", () => {
      const largeSeconds = 450 * 3600 + 15 * 60;
      expect(formatFriendlyDuration(largeSeconds)).toBe("450h 15m");
    });
  });
});
