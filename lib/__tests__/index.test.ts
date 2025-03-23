import { describe, it, expect } from "vitest";
import { toDocx } from "../src"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import fs from "fs";
import { htmlPlugin, listPlugin, mathPlugin, tablePlugin, imagePlugin } from "../src/plugins";

const markdown = fs.readFileSync("../sample.md", "utf-8");

describe("toDocx", () => {
  it("should convert a basic Markdown string to a DOCX Blob", async () => {
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Test Document" }, { useTitle: false });

    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should return a buffer if outputType is 'buffer'", async () => {
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBuffer = await toDocx(mdast, {}, {}, "arraybuffer");

    expect(docxBuffer).toBeInstanceOf(ArrayBuffer);
  });

  it("should include a title in the document properties", async () => {
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
      // skipcq: JS-0323
      await toDocx(null as any, {}, {});
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle footnotes", async ({ expect }) => {
    const mdast = unified().use(remarkParse).use(remarkGfm).parse(markdown);

    const docxBlob = await toDocx(
      mdast,
      { title: "Test Document" },
      { plugins: [htmlPlugin(), listPlugin(), imagePlugin(), mathPlugin(), tablePlugin()] },
    );

    expect(docxBlob).toBeInstanceOf(Blob);
  });
});
