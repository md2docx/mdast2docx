import { readFileSync } from "node:fs";
import { toDocx } from "mdast2docx";
import { listPlugin, mathPlugin, tablePlugin } from "mdast2docx/dist/plugins";
import { NextResponse } from "next/server";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";

const docxProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkMath);

/**
 * Generate a docx file from markdown on server side.
 * @returns docx file
 */
export const GET = async () => {
  const md = readFileSync("../../sample.md", "utf-8");
  const mdast = docxProcessor.parse(md);
  const buffer = await toDocx(
    mdast,
    {},
    { plugins: [tablePlugin(), listPlugin(), mathPlugin()] },
    "arraybuffer",
  );
  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="sample.docx"',
    },
  });
};
