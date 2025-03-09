"use client";

import { unified } from "unified";
import md from "./sample.md";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";
import { toDocx } from "mdast2docx";
import styles from "./demo.module.scss";

/** React live demo */
export function Demo() {
  const docxProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(remarkMath);

  const mdast = docxProcessor.parse(md);

  const downloadDocx = () => {
    toDocx(mdast, {}, {}, "blob").then(blob => {
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "my-document.docx";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  // console.log(docxProcessor.processSync(md));
  return (
    <div className={styles.demo}>
      <h1>MDAST (Markdown Abstract Syntax Tree) to DOCX</h1>
      <details>
        <summary>Markdown file</summary>
        <pre>{md}</pre>
      </details>
      <button onClick={downloadDocx}>Download as DOCX</button>
      {/* <pre>{JSON.stringify(mdast, null, 2)}</pre> */}
    </div>
  );
}
