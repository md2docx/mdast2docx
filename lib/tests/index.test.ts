import { describe, it, expect } from "vitest";
import { toDocx } from "../src"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";
import remaskGfm from "remark-gfm";

describe("toDocx", () => {
  it("should convert a basic Markdown string to a DOCX Blob", async () => {
    const markdown = "# Hello, World!";
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Test Document" }, {});

    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should return a buffer if outputType is 'buffer'", async () => {
    const markdown = "## Testing Buffer Output";
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBuffer = await toDocx(mdast, {}, {}, "arraybuffer");

    expect(docxBuffer).toBeInstanceOf(ArrayBuffer);
  });

  it("should include a title in the document properties", async () => {
    const markdown = "### Document with Title";
    const mdast = unified().use(remarkParse).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Custom Title" }, {});

    expect(docxBlob).toBeDefined(); // Ensure output exists
  });

  it("should handle multiple MDAST inputs", async () => {
    const md1 = unified().use(remarkParse).parse("# First Section");
    const md2 = unified().use(remarkParse).parse("## Second Section");

    const docxBlob = await toDocx([{ ast: md1 }, { ast: md2 }], { title: "Multi-section Doc" }, {});

    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should fail gracefully when given an invalid MDAST input", async () => {
    try {
      // Passing an invalid AST
      await toDocx(null as any, {}, {});
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle footnotes", async ({ expect }) => {
    const markdown = `---
title: "Markdown Syntax Showcase"
description: "A comprehensive example of Markdown syntax supported by mdast."
author: "Mayank Chaudhari"
date: "2025-03-03"
categories: [Markdown, Syntax, Documentation]
tags: [mdast, markdown, reference]
---

# Markdown Syntax Showcase

## 1. Basic Elements

A collection of fundamental Markdown syntax elements.

### Headings

Different levels of headings for structuring content.

# Heading 1

The largest heading, usually reserved for the main title of the document.

## Heading 2

A subheading, used to separate major sections.

### Heading 3

A smaller heading, often used for subsections.

#### Heading 4

A more detailed subsection heading.

##### Heading 5

A minor heading, used for further breakdown.

###### Heading 6

The smallest heading, typically used for fine details.

### Text Formatting

Various ways to style text.

**Bold text**  
_Italic text_  
~~Strikethrough~~  
\`Inline code\`

### Blockquote

Used for quoting text.

> This is a blockquote.

### Horizontal Rule

A horizontal line for section separation.

---

## 2. Lists

Different types of lists for organizing information.

### Unordered List

A list with bullet points.

- Item 1
- Item 2
  - Subitem 1
  - Subitem 2
- Item 3

### Ordered List

A numbered list.

1. First item
2. Second item
   1. Subitem 1
   2. Subitem 2
3. Third item

## 3. Code Blocks

Displaying code snippets in different programming languages.

### JavaScript Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, ${name}!\`);
}
greet("Mayank");
\`\`\`

### Python Example

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")

greet("Mayank")
\`\`\`

### Java Example

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Mayank!");
    }
}
\`\`\`

### C++ Example

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Mayank!" << endl;
    return 0;
}
\`\`\`

## 4. Tables

Structuring data in tabular format.

| Name  | Age | Location      |
| ----- | --- | ------------- |
| John  | 25  | New York      |
| Alice | 30  | San Francisco |
| Bob   | 28  | London        |

## 5. Links and Images

Adding hyperlinks and images.

### Links

[OpenAI](https://openai.com)

### Images

Embedding images in Markdown.

![Markdown Logo](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

Another example:

![Sample Image](https://via.placeholder.com/150)

Additional image example:

![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

### Reference Links in Markdown

This is an example of using reference-style links in Markdown.

You can define a reference link like this\
[OpenAI][openai] is an AI research and deployment company.

Markdown syntax is explained in detail on [Markdown Guide][md-guide].

#### References

[openai]: https://openai.com "OpenAI Website"
[md-guide]: https://www.markdownguide.org "Markdown Guide"

## 6. Task Lists (GFM)

Checkable task lists.

- [x] Task 1 - Completed
- [ ] Task 2 - Pending
- [ ] Task 3 - Pending
  - [x] Subtask 3.1 - Done
  - [ ] Subtask 3.2 - Pending
- [ ] Task 4 - In Progress
- [ ] Task 5 - Pending Review
- [x] Task 6 - Approved

Task lists are useful for tracking progress in projects.

## 7. Footnotes

Referencing additional information.

Here is a statement with a footnote.[^1]

[^1]: This is the footnote content.

## 8. Emoji (GFM)

Using emojis in Markdown.

:smile: :rocket: :tada: :fire: :computer:

## 9. Math Equations (KaTeX / LaTeX)

Displaying mathematical expressions.

Inline equation: $E=mc^2$

Block equation:

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

## 10. Diagrams (Mermaid)

Visualizing data with diagrams.

### Flowchart

\`\`\`mermaid
graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;
\`\`\`

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
  participant A
  participant B
  A->>B: Hello, how are you?
  B->>A: I'm good, thanks!
\`\`\`

### Mindmap

\`\`\`mindmap
- Root
  - Branch 1
    - Subbranch 1
    - Subbranch 2
  - Branch 2
    - Subbranch 3
    - Subbranch 4
\`\`\`

### Chart (Gantt)

\`\`\`mermaid
gantt
  title Project Timeline
  dateFormat  YYYY-MM-DD
  section Development
  Task 1 :done, 2024-01-01, 2024-01-10
  Task 2 :active, 2024-01-11, 2024-01-20
  Task 3 : 2024-01-21, 2024-01-30
\`\`\`

## 11. Definition Lists

Defining terms and meanings.

Term 1  
: Definition 1

Term 2  
: Definition 2a  
: Definition 2b

## 12. Admonitions (Callouts)

Highlighting important notes or warnings.

> **Note:** This is an important note.
> **Warning:** Be careful with this step!

## 13. HTML Elements

Using HTML for additional interactivity.

<details>
  <summary>Click to expand</summary>
  This is hidden content.
</details>

## 14. Custom Directives (MDX)

Embedding custom components.

\`\`\`mdx
<MyComponent title="Hello World" />
\`\`\`

---

This document covers most of the syntax supported by \`mdast\`, including extended Markdown features such as GFM, math, diagrams, and MDX components.
`;
    const mdast = unified().use(remarkParse).use(remaskGfm).parse(markdown);

    const docxBlob = await toDocx(mdast, { title: "Test Document" }, {});

    expect(docxBlob).toBeInstanceOf(Blob);
  });
});
