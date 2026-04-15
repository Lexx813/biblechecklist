import { describe, it, expect } from "vitest";
import { parseTranslationStream } from "../translateStream";

describe("parseTranslationStream", () => {
  it("returns empty strings when no delimiters present", () => {
    const result = parseTranslationStream("some partial text");
    expect(result).toEqual({ title: "", excerpt: "", content: "" });
  });

  it("parses a complete response correctly", () => {
    const input = `---TITLE---
Hola Mundo
---EXCERPT---
Un resumen breve
---CONTENT---
<p>Contenido completo aquí</p>`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Hola Mundo");
    expect(result.excerpt).toBe("Un resumen breve");
    expect(result.content).toBe("<p>Contenido completo aquí</p>");
  });

  it("parses a partial response mid-stream (only title so far)", () => {
    const input = `---TITLE---
Partially streamed title`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Partially streamed title");
    expect(result.excerpt).toBe("");
    expect(result.content).toBe("");
  });

  it("parses title and excerpt but not yet content", () => {
    const input = `---TITLE---
Full title
---EXCERPT---
Full excerpt`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Full title");
    expect(result.excerpt).toBe("Full excerpt");
    expect(result.content).toBe("");
  });

  it("preserves HTML tags in content", () => {
    const input = `---TITLE---
Title
---EXCERPT---
Excerpt
---CONTENT---
<p>Para one</p><p>Para two</p>`;
    const result = parseTranslationStream(input);
    expect(result.content).toBe("<p>Para one</p><p>Para two</p>");
  });

  it("trims whitespace from title and excerpt but not content", () => {
    const input = `---TITLE---
  Padded Title
---EXCERPT---
  Padded Excerpt
---CONTENT---
<p>Content</p>`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Padded Title");
    expect(result.excerpt).toBe("Padded Excerpt");
    expect(result.content).toBe("<p>Content</p>");
  });
});
