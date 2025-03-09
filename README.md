# **MDAST (Markdown Abstract Syntax Tree) to DOCX** <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

🚀 **Effortlessly convert Markdown Abstract Syntax Trees (MDAST) to DOCX.**

[![Test](https://github.com/tiny-md/mdast2docx/actions/workflows/test.yml/badge.svg)](https://github.com/tiny-md/mdast2docx/actions/workflows/test.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/aa896ec14c570f3bb274/maintainability)](https://codeclimate.com/github/tiny-md/mdast2docx/maintainability) [![Code Coverage](https://codecov.io/gh/tiny-md/mdast2docx/graph/badge.svg)](https://codecov.io/gh/tiny-md/mdast2docx) [![Version](https://img.shields.io/npm/v/mdast2docx.svg?colorB=green)](https://www.npmjs.com/package/mdast2docx) [![Downloads](https://img.shields.io/npm/d18m/mdast2docx)](https://www.npmjs.com/package/mdast2docx) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/mdast2docx)

---

## **✨ Features**

✅ **MDAST to DOCX conversion** — Supports standard Markdown elements  
✅ **Footnotes handling** — Converts Markdown footnotes to DOCX format  
✅ **Customizable image handling** — Fine-tune image rendering in DOCX  
✅ **Hyperlink support** — Converts external links, internal links [WIP]  
✅ **Configurable sections** — Customize document structure & styling

---

## **📦 Installation**

Install the package using `pnpm`, `npm`, or `yarn`:

```bash
pnpm add mdast2docx
```

**_or_**

```bash
npm install mdast2docx
```

**_or_**

```bash
yarn add mdast2docx
```

---

## **🚀 Usage**

### **Basic Example**

```typescript
import { toDocx } from "mdast2docx";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMmd from "remark-mmd"; // Assumed MMD plugin

const markdown = `
# Sample Document  
This is a **bold** text and _italic_ text.  

> A blockquote example  

- List Item 1  
- List Item 2  

[Click Here](https://example.com)  

![Sample Image](https://example.com/image.png)  

This is a footnote reference[^1].  

[^1]: This is the footnote content.
`;

const mdast = unified().use(remarkParse).use(remarkMmd).parse(markdown);

(async () => {
  const docxBlob = await toDocx(mdast, { title: "My Document" }, {});
  const url = URL.createObjectURL(docxBlob as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.docx";
  link.click();
  URL.revokeObjectURL(url);
})();
```

---

## **🛠 API Reference**

### **`toDocx(astInputs, docxProps, defaultSectionProps, outputType?)`**

| Parameter                 | Type                                               | Description                                                      |
| ------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `astInputs`               | `Root` \| `{ ast: Root; props?: ISectionProps }[]` | Single or multiple MDAST trees with optional section properties. |
| `docxProps`               | `IDocxProps`                                       | General document properties (title, styles, metadata).           |
| `defaultSectionProps`     | `ISectionProps`                                    | Default properties for document sections.                        |
| `outputType` _(optional)_ | `"blob"` (default) \| `"buffer"` \| `"base64"`     | Format of the generated DOCX document.                           |

📌 **Returns:** A `Promise` resolving to a DOCX document in the chosen format.

---

## **📜 Supported Markdown Elements**

| Markdown Syntax                    | Supported in DOCX      |
| ---------------------------------- | ---------------------- |
| Headings `# H1` to `###### H6`     | ✅                     |
| Paragraphs                         | ✅                     |
| Bold `**text**` & Italics `_text_` | ✅                     |
| Blockquotes `> quote`              | ✅                     |
| Lists (ordered & unordered)        | ✅                     |
| Links `[text](url)`                | ✅                     |
| Images `![alt](url)`               | ✅                     |
| Code Blocks `` `code` ``           | ✅                     |
| Footnotes `[^1]`                   | ✅                     |
| Tables                             | 🚧 _(Coming soon)_     |
| HTML Tags                          | 🚧 _(Partial support)_ |

---

## **🔧 Configuration**

You can customize the DOCX output using `ISectionProps` and `IDocxProps`.

### **Example: Customizing Styles**

```typescript
const docxProps = {
  title: "Styled Document",
  author: "John Doe",
};

const sectionProps = {
  page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } },
};

const docxBlob = await toDocx(mdast, docxProps, sectionProps);
```

📖 **More details:**

- [DOCX.js Document Properties](https://docx.js.org/#/usage/document)
- [DOCX.js Section Options](https://docx.js.org/#/usage/sections)

---

## **📝 Contributing**

We welcome contributions! To get started:

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature-new`)
3. **Commit your changes** (`git commit -m "Add new feature"`)
4. **Push to GitHub** (`git push origin feature-new`)
5. **Open a Pull Request** 🚀

---

## **📄 License**

This project is **licensed under MPL-2.0**. See the [LICENSE](./LICENSE) file for details.

---

## **🙌 Acknowledgments**

Thanks to the **docx.js** and **unified.js** ecosystems for making this possible.

> ⭐ **Star this repository** if you find it useful!  
> ❤️ Support our work by [sponsoring](https://github.com/sponsors/mayank1513).

---

<p align="center">Made with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
