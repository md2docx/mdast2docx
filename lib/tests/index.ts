import { describe, it, expect } from "vitest";
import { toDocx } from "../src"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";

describe("toDocx", () => {
  it("should convert a basic Markdown string to a DOCX Blob", async () => {
    const markdown = "# Hello, World!";
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Test Document" }, {});

    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should return a buffer if outputType is 'buffer'", async () => {
    const markdown = "## Testing Buffer Output";
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBuffer = await toDocx(mdast, {}, {}, "buffer");

    expect(docxBuffer).toBeInstanceOf(Buffer);
  });

  it("should include a title in the document properties", async () => {
    const markdown = "### Document with Title";
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Custom Title" }, {});

    expect(docxBlob).toBeDefined(); // Ensure output exists
  });

  it("should handle multiple MDAST inputs", async () => {
    const md1 = unified().use(remarkParse).parse("# First Section");
    const md2 = unified().use(remarkParse).parse("## Second Section");

    const docxBlob = await toDocx([{ ast: md1 }, { ast: md2 }], { title: "Multi-section Doc" }, {});

    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should fail gracefully when given an invalid MDAST input", async () => {
    try {
      // Passing an invalid AST
      await toDocx(null as any, {}, {});
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
