# @m2d/remark-docx <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" height="40"/>

[![Version](https://img.shields.io/npm/v/@m2d/remark-docx?color=green)](https://www.npmjs.com/package/@m2d/remark-docx)
![Downloads](https://img.shields.io/npm/d18m/@m2d/remark-docx)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/@m2d/remark-docx)

> A Unified/Remark plugin that injects a DOCX compiler using [`mdast2docx`](https://github.com/tiny-md/mdast2docx) and outputs `.docx` files from Markdown.

---

## 🧭 Overview

`@m2d/remark-docx` enables direct export of Markdown content to Microsoft Word (`.docx`) using the Unified ecosystem. It seamlessly bridges `remark` with the [`mdast2docx`](https://github.com/tiny-md/mdast2docx) compiler and auto-injects common plugins like GFM tables, math, lists, and inline HTML support.

It’s designed for both **browser** and **Node.js** environments, handling environment-specific features like image or HTML parsing smartly.

---

## ✨ Features

- 📄 Converts Markdown to `.docx` using `mdast2docx`
- 🔌 Auto-injects plugins for GFM tables, math, lists, images, and HTML
- 🧠 Smart: excludes DOM-only plugins in Node.js
- 💥 Supports both `.process()` and `.processSync()` with an async `.result`
- 🔄 Output as `Blob`, `Buffer`, or `base64`

---

## 📦 Installation

```bash
npm install @m2d/remark-docx docx
```

Also install any optional plugins you wish to include in your pipeline:

```bash
npm install remark-parse remark-gfm remark-math remark-frontmatter
```

Other package managers:

```bash
yarn add @m2d/remark-docx docx
pnpm add @m2d/remark-docx docx
```

---

## 🚀 Usage

### 🔗 Browser Example (Async)

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import { remarkDocx } from "@m2d/remark-docx";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkMath)
  .use(remarkDocx);

const downloadDocx = () => {
  processor
    .process(md)
    .then(res => res.result)
    .then(blob => {
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document.docx";
      link.click();
      URL.revokeObjectURL(url);
    });
};
```

### ⚡ Browser Example (Sync + Async Result)

```ts
const { result } = processor.processSync(md) as { result: Promise<Blob> };
result.then(blob => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.docx";
  link.click();
  URL.revokeObjectURL(url);
});
```

---

### 🐢 Node.js Example

```ts
import fs from "node:fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import { remarkDocx } from "@m2d/remark-docx";

const markdown = `
# Hello DOCX

This is a *Markdown* document with **tables**, math, and more.

| A | B |
|---|---|
| 1 | 2 |

Inline math: $x^2 + y^2 = z^2$
`;

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkMath)
  .use(remarkDocx, "buffer"); // outputType = "buffer" in Node

const { result } = processor.processSync(markdown) as { result: Promise<Buffer> };

result.then(buffer => {
  fs.writeFileSync("output.docx", buffer);
  console.log("✔ DOCX file written: output.docx");
});
```

---

## 🧩 Plugin Behavior

By default, these `mdast2docx` plugins are included:

| Plugin        | Description             |
| ------------- | ----------------------- |
| `htmlPlugin`  | Parses inline HTML      |
| `tablePlugin` | GFM table support       |
| `listPlugin`  | Ordered/unordered lists |
| `mathPlugin`  | KaTeX math blocks       |
| `imagePlugin` | Resolves images         |

On **Node.js**, `htmlPlugin` and `imagePlugin` are automatically excluded to avoid DOM dependency issues.

To override this behavior, pass custom plugins using `sectionProps.plugins`.

---

## 📘 API

### `remarkDocx(outputType?, docxProps?, sectionProps?)`

| Param          | Type                                 | Description                         |
| -------------- | ------------------------------------ | ----------------------------------- |
| `outputType`   | `"blob"` \| `"buffer"` \| `"base64"` | Default is `"blob"`                 |
| `docxProps`    | `IDocxProps`                         | Global DOCX config (optional)       |
| `sectionProps` | `ISectionProps`                      | Section + plugin control (optional) |

Returns a `Processor` where `.result` on `vfile` is a `Promise<Blob | Buffer | string>` depending on the mode.

---

## 🔥 Output Handling

Both `.process()` and `.processSync()` return a `vfile` with a `result` field:

```ts
const file = await processor.process(md);
const blobOrBuffer = await file.result;
```

> This makes the plugin environment-safe and decoupled from internal mutation or I/O.

---

## 🛠 Development

```bash
npm run dev       # Watch mode
npm run build     # Compile to /dist
npm run lint      # Lint source
npm run test      # Run tests
```

---

## 📄 License

Licensed under the [MPL-2.0 License](https://www.mozilla.org/en-US/MPL/2.0/).

---

## 💖 Sponsors

Support the project & its ecosystem:

- [@tiny-md](https://github.com/sponsors/tiny-md)
- [@mayank1513](https://github.com/sponsors/mayank1513)

---

## 🔗 Related Projects

- [`mdast2docx`](https://github.com/tiny-md/mdast2docx) – The DOCX engine
- [`docx`](https://github.com/dolanmiu/docx) – Low-level DOCX generation
- [`unified`](https://unifiedjs.com) – Processor pipeline
- [`remark`](https://github.com/remarkjs/remark) – Markdown parser

---

<p align="center">Made with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
