import { describe, it, expect } from "vitest";
import { toDocx } from "../src"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";
import fs from "fs";

const markdown = fs.readFileSync("../sample.md", "utf-8");

describe("toDocx", () => {
  it("should convert a basic Markdown string to a DOCX Blob", async () => {
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Test Document" }, { useTitle: false });

    expect(docxBlob).toBeInstanceOf(Blob);
  });
});
