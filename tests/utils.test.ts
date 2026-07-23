import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    const value = cn("px-2", false && "hidden", "py-1", "px-4");
    expect(value).toContain("py-1");
    expect(value).toContain("px-4");
    expect(value).not.toContain("px-2");
  });

  it("deduplicates conflicting tailwind utilities", () => {
    const value = cn("text-sm", "text-lg", "font-medium");
    expect(value).toContain("text-lg");
    expect(value).not.toContain("text-sm");
    expect(value).toContain("font-medium");
  });
});
