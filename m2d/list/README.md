# `@m2d/list` <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" height="40"/>

![Version](https://img.shields.io/npm/v/@m2d/list?color=green) ![Downloads](https://img.shields.io/npm/dm/@m2d/list) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@m2d/list)

> Enables **ordered list** support in DOCX output from Markdown.

---

## 📦 Installation

```bash
npm install @m2d/list
```

```bash
pnpm add @m2d/list
```

```bash
yarn add @m2d/list
```

---

## 🚀 Overview

The `@m2d/list` plugin for [`mdast2docx`](https://github.com/mayankchaudhari/mdast2docx) enables structured list rendering — including support for multilevel ordered lists (`1.`, `1.1`, `A.`, etc.) and customizable bullet points.

Features:

- Nested ordered/unordered lists
- Hierarchical formatting (e.g., `1.1`, `A.`, `a.`)
- Word-compatible bullet symbols (● ○ ■ ◆ ▶ …)
- Optional use of Word's default list styling

---

## 🛠️ Usage

```ts
import { listPlugin } from "@m2d/list";

const plugins = [
  htmlPlugin(),
  listPlugin(), // ✅ Place after htmlPlugin
  // ...other plugins like @m2d/core or @m2d/html
];
```

> 🧠 If you're using `@m2d/html`, ensure it comes **before** this plugin so HTML-based `<ul>` and `<ol>` tags are parsed correctly.

---

## 📋 Example

```md
- Bullet list item
  - Nested bullet
    - More depth

1. Ordered list
2. Next item
   1. Nested 1.1
   2. Nested 1.2
```

🧾 **Result**: Properly formatted multilevel lists in the generated `.docx`.

---

## ⚙️ Plugin Options

```ts
interface IListPluginOptions {
  /**
   * Custom ordered list level configurations.
   * Controls numbering format and indentation per depth.
   */
  levels?: ILevelsOptions[];

  /**
   * Custom bullet list level configurations.
   * Controls numbering format and indentation per depth.
   */
  bulletLevels?: ILevelsOptions[];

  /**
   * Bullet characters (for up to 10 levels).
   * Defaults: ["●", "○", "■", "◆", "▶", "◉", "⬤", "♦", "◦", "▪"]
   */
  bullets?: string[];

  /**
   * Use Word's default bullet styles (instead of custom).
   * Default: false
   */
  defaultBullets?: boolean;
}
```

### Example with Custom Options

```ts
listPlugin({
  defaultBullets: true, // use Word’s default styling
});
```

---

## 🧠 How It Works

1. Generates unique references for ordered and bullet lists (to prevent style conflicts).
2. Adds multi-level numbering or bullets using `docx`'s `ILevelsOptions`.
3. Recursively handles nested list levels with correct indentation.
4. Uses fallback bullet characters if level exceeds default array size.

---

## 💡 Features

- **Multilevel nesting** with increasing indentation
- **Customizable bullet characters** per depth
- **Word-compatible formatting** out of the box
- **Unique list styles** per instance (no collisions)
- This plugin ensures **consistent indentation** between ordered and unordered lists.
- List rendering assumes a **client-side** or DOM-like environment due to its dependency on DOCX-specific formatting and structure.

---

## **⚠️ Limitations**

- Task lists like `- [x]`, `- [ ]` are supported (via `@m2d/core`), but:
  - The checkbox is rendered as the **first character** of the list item.
  - It does **not replace** the bullet or number.

---

## 🔌 Related Plugins/Packages

| Plugin                                               | Purpose                                |
| ---------------------------------------------------- | -------------------------------------- |
| [`@m2d/core`](https://npmjs.com/package/@m2d/core)   | Converts extended MDAST to DOCX        |
| [`@m2d/html`](https://npmjs.com/package/@m2d/html)   | Parses raw HTML to extended MDAST      |
| [`@m2d/table`](https://npmjs.com/package/@m2d/table) | Renders table nodes to DOCX            |
| [`@m2d/image`](https://npmjs.com/package/@m2d/image) | Renders inline images into DOCX format |

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
