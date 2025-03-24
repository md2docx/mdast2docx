# `@m2d/image` <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" height="40"/>

[![Version](https://img.shields.io/npm/v/@m2d/image?color=green)](https://www.npmjs.com/package/@m2d/image) ![Downloads](https://img.shields.io/npm/d18m/@m2d/image) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@m2d/image)

> Converts Markdown (`![alt](url)`) and HTML `<img>` nodes into **DOCX-compatible** `ImageRun` elements.

> Using `<img>` tag requires `@m2d/html` plugin.

---

## 📦 Installation

```bash
npm install @m2d/image
```

```bash
pnpm add @m2d/image
```

```bash
yarn add @m2d/image
```

---

## 🚀 Overview

The `@m2d/image` plugin for [`mdast2docx`](https://github.com/mayankchaudhari/mdast2docx) enables inline image rendering in DOCX files.

It supports:

- Base64 and external URLs
- Common image formats like `jpg`, `png`, `gif`, `bmp`
- Fallbacks and transformations
- SVG fallback support via auto-rendering

---

## 🛠️ Usage

```ts
import { imagePlugin } from "@m2d/image";

const plugins = [
  htmlPlugin(),
  imagePlugin(), // ✅ Place after htmlPlugin
  tablePlugin(),
];
```

> 🧠 If you're using `@m2d/html`, ensure it comes **before** this plugin so HTML-based `<img>` tags are parsed correctly.

---

## 🧪 Production Ready

This plugin is **production-ready** and powers inline image rendering for `mdast2docx`.  
It has built-in fallbacks and intelligent resolution for base64 and external images.

> 💬 **Contributions and ideas are welcome!**  
> Feel free to open an issue or PR.

---

## 🖼️ Supported Image Types

- `jpeg`
- `jpg`
- `png`
- `bmp`
- `gif`

> SVG is supported with fallback rendering into PNG.

---

## ⚙️ Plugin Options

```ts
interface IImagePluginOptions {
  scale?: number; // default: 3 — scales image resolution when using base64
  fallbackImageType?: "png" | "jpg" | "bmp" | "gif";
  imageResolver?: (src: string, options?: IImagePluginOptions) => Promise<IImageOptions>;
}
```

### Custom Image Resolver

Use this to override how images are loaded and transformed:

```ts
const customResolver: ImageResolver = async (src, options) => {
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  return {
    type: "png",
    data: arrayBuffer,
    transformation: {
      width: 400,
      height: 300,
    },
  };
};

imagePlugin({ imageResolver: customResolver });
```

---

## 🧠 How It Works

1. Checks if the image is a base64 or remote URL.
2. Parses image format, dimensions, and scale.
3. Wraps the image as a `docx.ImageRun` with metadata (like alt text).
4. Provides fallbacks if image type is unsupported or fails.

---

## 💡 Features

- **Inline Markdown images**: `![alt](url)`
- **HTML `<img>` tags**: when combined with `@m2d/html`
- **Auto-scaled rendering** using canvas
- **SVG support with fallback** to PNG via `canvas`

---

## ⚠️ Limitations

- Requires client-side (DOM) environment (uses `<canvas>`, `<img>`, etc.)
- Not compatible with server-side rendering (SSR) _Node.js image plugin coming soon!_
- External images must be accessible (CORS-safe URLs)

---

## 🔌 Related Plugins/Packages

| Plugin                                               | Purpose                                |
| ---------------------------------------------------- | -------------------------------------- |
| [`@m2d/core`](https://npmjs.com/package/@m2d/core)   | Converts extended MDAST to DOCX        |
| [`@m2d/html`](https://npmjs.com/package/@m2d/html)   | Parses raw HTML to extended MDAST      |
| [`@m2d/table`](https://npmjs.com/package/@m2d/table) | Renders table nodes to DOCX            |
| [`@m2d/list`](https://npmjs.com/package/@m2d/list)   | Enhanced list support (tasks, bullets) |

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
