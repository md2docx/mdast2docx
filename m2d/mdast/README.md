# `@m2d/mdast` <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" height="40"/>

[![Version](https://img.shields.io/npm/v/@m2d/mdast?color=green)](https://www.npmjs.com/package/@m2d/mdast) ![Downloads](https://img.shields.io/npm/d18m/@m2d/mdast) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@m2d/mdast)

> Extended MDAST types and nodes with custom properties and extra formatting data for `mdast2docx`.

---

## 📦 Installation

```bash
npm install @m2d/mdast
```

```bash
pnpm add @m2d/mdast
```

```bash
yarn add @m2d/mdast
```

---

## 🚀 Overview

The `@m2d/mdast` package enhances the standard [MDAST](https://github.com/syntax-tree/mdast) specification by introducing:

- New **custom node types** to support advanced features.
- Extended **`.data`** fields for compatibility with the `docx` library.
- Internal utilities used by the `mdast2docx` ecosystem for fine-grained control.

This allows the entire processing pipeline to recognize, style, and transform nodes with rich document semantics during DOCX generation.

---

## ✨ Extended Node Types

```ts
export interface EmptyNode {
  type: ""; // Used to skip further processing
  [key: string]: unknown;
}

export interface Fragment extends Parent {
  type: "fragment";
  children: (RootContent | PhrasingContent)[];
}

export interface Checkbox extends Node {
  type: "checkbox";
  checked?: boolean;
}
```

### 💡 Why?

- `EmptyNode`: Prevents duplicate processing (similar to `event.stopPropagation()`).
- `Fragment`: Acts like a container node for grouping without injecting a parent block (like React fragments).
- `Checkbox`: Represents checkbox nodes parsed from GFM syntax or HTML input tags.

---

## 🛠️ Extended Data Props

The `data` field on MDAST nodes is enriched to include DOCX-compatible styling options:

```ts
export interface Data extends UnistData {
  border?: IBorderOptions | IBordersOptions;
  alignment?: AlignmentType;
  bold?: boolean;
  italics?: boolean;
  underline?: { type: UnderlineType; color: string } | {};
  emphasisMark?: {};
  strike?: boolean;
  allCaps?: boolean;
  smallCaps?: boolean;
  subScript?: boolean;
  superScript?: boolean;
  color?: string;
  highlight?: string; // highlight color
  frame?: IFrameOptions;
  pre?: boolean;
}
```

### 📌 Use Cases

- Styling from inline/block HTML is parsed into these fields for direct use with `docx`.
- Rich formatting control like highlights, alignment, text effects, and borders.
- Useful when transforming MDAST to Word-compatible components.

---

## 🧩 Integration

This package is used internally by:

- [`@m2d/core`](https://www.npmjs.com/package/@m2d/core)
- Plugins like [`@m2d/html`](https://www.npmjs.com/package/@m2d/html), [`@m2d/image`](https://www.npmjs.com/package/@m2d/image), etc.

You don’t need to use this package directly unless you're working on custom plugins or extending the MDAST tree manually.

---

## 🧾 License

MIT © [Mayank Chaudhari](https://github.com/mayankchaudhari)

---

<p align="center">Made with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
