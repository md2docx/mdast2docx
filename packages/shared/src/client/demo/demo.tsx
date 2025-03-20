"use client";

import { unified } from "unified";
import md from "../../../../../sample.md";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";
import styles from "./demo.module.scss";
import { CodeDisplay } from "./code-display";
import { removePosition } from "unist-util-remove-position";
import { toDocx } from "mdast2docx";
import {
  htmlPlugin,
  imagePlugin,
  tablePlugin,
  listPlugin,
  mathPlugin,
} from "mdast2docx/dist/plugins";
// skipcq: JS-R1001
import demoCode from "./demo.tsx?raw";

/** React live demo */
export function Demo() {
  const docxProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(remarkMath);

  const mdast = docxProcessor.parse(md);

  removePosition(mdast);

  const downloadDocx = () => {
    toDocx(
      mdast,
      {},
      { plugins: [imagePlugin(), tablePlugin(), listPlugin(), mathPlugin(), htmlPlugin()] },
      "blob",
    ).then(blob => {
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "my-document.docx";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  // console.log(docxProcessor.processSync(md));

  const code: { filename: string; code: string }[] = [
    { filename: "sample.md", code: md },
    { filename: "MDAST", code: JSON.stringify(mdast, null, 2) },
    { filename: "demo.tsx", code: demoCode },
  ];
  return (
    <div className={styles.demo}>
      <h1>MDAST (Markdown Abstract Syntax Tree) to DOCX</h1>
      <button className={styles.btn} onClick={downloadDocx}>
        Download as DOCX
      </button>
      <CodeDisplay code={code} />
      {/* <pre>{JSON.stringify(mdast, null, 2)}</pre> */}
    </div>
  );
}
