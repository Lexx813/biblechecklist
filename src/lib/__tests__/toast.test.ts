// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { toast } from "../toast";

describe("toast", () => {
  let events: CustomEvent[] = [];
  let handler: (e: Event) => void;

  beforeEach(() => {
    events = [];
    handler = (e) => events.push(e as CustomEvent);
    window.addEventListener("nwt-toast", handler);
  });

  afterEach(() => {
    window.removeEventListener("nwt-toast", handler);
  });

  it("dispatches nwt-toast event with message and default type 'success'", () => {
    toast("All done!");
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ message: "All done!", type: "success" });
  });

  it("toast.success dispatches type success", () => {
    toast.success("Saved");
    expect(events[0].detail).toEqual({ message: "Saved", type: "success" });
  });

  it("toast.error dispatches type error", () => {
    toast.error("Something went wrong");
    expect(events[0].detail).toEqual({ message: "Something went wrong", type: "error" });
  });

  it("toast.info dispatches type info", () => {
    toast.info("FYI");
    expect(events[0].detail).toEqual({ message: "FYI", type: "info" });
  });

  it("toast.warning dispatches type warning", () => {
    toast.warning("Watch out");
    expect(events[0].detail).toEqual({ message: "Watch out", type: "warning" });
  });

  it("dispatches once per call", () => {
    toast("one");
    toast("two");
    expect(events).toHaveLength(2);
  });
});
