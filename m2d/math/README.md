# `@m2d/math`

![Version](https://img.shields.io/npm/v/@m2d/math?color=green) ![Downloads](https://img.shields.io/npm/d18m/@m2d/math) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@m2d/math)

> A plugin that transforms LaTeX-style math (inline and block) into DOCX-compatible equations using docx.

---

## 📦 Installation

```bash
npm install @m2d/math
```

```bash
pnpm add @m2d/math
```

```bash
yarn add @m2d/math
```

---

## 🚀 Overview

The `@m2d/math` plugin for [`mdast2docx`](https://github.com/mayankchaudhari/mdast2docx) enables support for **LaTeX math rendering** in DOCX exports. It parses inline and block-level math expressions written in LaTeX syntax and converts them into proper Word-compatible Math elements using the `docx` library.

> Supports superscripts, subscripts, fractions, radicals, summations, symbols, and more.

---

## ✨ Features

- Parses LaTeX-style math expressions
- Converts math to `docx.MathRun`, `docx.MathFraction`, `docx.MathRadical`, etc.
- Supports inline and block math (`$...$`, `$$...$$`)
- Supports standard math macros like `\frac`, `\sqrt`, `\sum`, `\alpha`, and many others
- Handles superscripts (`^`) and subscripts (`_`) intelligently
- Gracefully ignores unsupported macros like `\left`, `\right`, etc.

---

## 🛠️ Usage

```ts
import { toDocx } from "@m2d/core";
import { mathPlugin } from "@m2d/math";

const plugins = [mathPlugin()];

const buffer = await toDocx(mdastTree, {
  plugins,
});
```

---

## 🧪 Example

### Input Markdown (via MDAST)

```md
This is inline math: $E = mc^2$

$$
\frac{a^2 + b^2}{c^2} = 1
$$
```

### Output DOCX

- Inline math (`$E = mc^2$`) → `E = mc²` as a Word MathRun.
- Block math renders as full equation paragraphs.

---

## ⚙️ Internals

- Uses [`latex-math`](https://www.npmjs.com/package/latex-math) to parse LaTeX math AST.
- Converts LaTeX nodes to `docx.MathRun[]` elements.
- Supports common math macros with fallback to Unicode symbols via an internal symbol map.
- Integrates seamlessly with `@m2d/core`.

---

## 🧩 Supported Macros

Includes (but not limited to):

```
\frac, \sqrt, \sum, \int, \alpha, \beta, \theta, \leq, \geq, \neq, \infty, \cdot
```

---

## **⚠️ Limitations**

- Does not support full LaTeX environments (`\begin{align}`, etc.)
- Complex expressions may need pre-processing
- Does not render styled math (`\textcolor`, etc.)

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
