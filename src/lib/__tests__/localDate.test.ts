import { describe, it, expect } from "vitest";
import { localDateStr } from "../localDate";

describe("localDateStr", () => {
  it("formats the local calendar day", () => {
    expect(localDateStr(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
    expect(localDateStr(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
  });

  it("applies day offsets across month and year boundaries", () => {
    expect(localDateStr(new Date(2026, 2, 1, 12), -1)).toBe("2026-02-28");
    expect(localDateStr(new Date(2026, 11, 31, 12), 1)).toBe("2027-01-01");
    expect(localDateStr(new Date(2026, 9, 10, 12), -7)).toBe("2026-10-03");
  });
});
