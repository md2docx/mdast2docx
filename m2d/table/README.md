# `@m2d/table` <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" height="40"/>

[![Version](https://img.shields.io/npm/v/@m2d/table?color=green)](https://www.npmjs.com/package/@m2d/table) ![Downloads](https://img.shields.io/npm/d18m/@m2d/table) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@m2d/table)

> A plugin that converts Markdown tables into rich, styled Word tables with full alignment, border, and header support.

---

## 📦 Installation

```bash
npm install @m2d/table
```

```bash
pnpm add @m2d/table
```

```bash
yarn add @m2d/table
```

---

## 🚀 Overview

The `@m2d/table` plugin for [`mdast2docx`](https://github.com/mayankchaudhari/mdast2docx) renders Markdown tables into Word-compatible tables with customizable layout, alignment, and cell styling using the `docx` library.

> Automatically handles header rows, borders, shading, cell alignments, and padding — all configurable.

---

## ✨ Features

- Transforms Markdown tables into `docx.Table` elements
- Auto-detects column alignment from MDAST (`left`, `center`, `right`)
- Customizable:
  - Table width and border styles
  - Cell padding and shading
  - Header row formatting
  - Horizontal and vertical alignment
- Graceful fallback to defaults if MDAST alignment is missing

---

## 🛠️ Usage

```ts
import { toDocx } from "@m2d/core";
import { tablePlugin } from "@m2d/table";

const plugins = [tablePlugin()];

const buffer = await toDocx(mdastTree, {
  plugins,
});
```

---

## ⚙️ Options

The `tablePlugin` accepts an optional configuration object:

```ts
tablePlugin({
  tableProps: { ... },
  rowProps: { ... },
  cellProps: { ... },
  firstRowProps: { ... },
  firstRowCellProps: { ... },
  alignments: {
    defaultHorizontalAlign: AlignmentType.CENTER,
    defaultVerticalAlign: VerticalAlign.CENTER,
    preferMdData: true,
  },
});
```

All options override the following sensible defaults:

### Default Table Style

| Property             | Default Value                          |
| -------------------- | -------------------------------------- |
| Table Width          | `100%` (percentage)                    |
| Border Style         | `SINGLE`, size `1`                     |
| Cell Padding         | 2–4mm margins (top/bottom/left/right)  |
| Header Row           | Bold with shaded background `#b79c2f`  |
| Vertical Alignment   | `CENTER`                               |
| Horizontal Alignment | Based on Markdown or `CENTER` fallback |

---

## 🧪 Example

### Markdown Input

```md
| Name  | Age |      City |
| :---: | :-: | --------: |
| Alice | 24  |  New York |
|  Bob  | 30  | San Diego |
```

### Output DOCX

- The first row is treated as a **header**, with custom shading.
- Column alignment is preserved: center, center, right.

---

## 🔍 Internals

- Leverages `docx.Table`, `docx.TableRow`, `docx.TableCell`, and `docx.Paragraph`
- Dynamically maps Markdown alignment via `MDAST.align[]`
- Uses `@m2d/core`’s block plugin API
- Prevents re-processing of transformed nodes by setting `node.type = ""`

---

## ⚠️ Limitations

- Does not support row/column spans
- MDAST source must conform to [GFM tables](https://github.github.com/gfm/#tables-extension-)
- Table styling is fixed to plugin options; no per-cell customization via Markdown yet

---

## ⭐ Support Us

If you find this useful:

- ⭐ Star [mdast2docx](https://github.com/tiny-md/mdast2docx) on GitHub
- ❤️ Consider [sponsoring](https://github.com/sponsors/mayank1513)

---

## 🧾 License

MIT © [Mayank Chaudhari](https://github.com/mayankchaudhari)

---

<p align="center">Made with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
