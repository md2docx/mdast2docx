---
"mdast2docx": minor
---

The following @m2d/* dependencies were upgraded:

### @m2d/core: 1.5.0 → 1.7.0

**Minor Changes**
- Add footnoteProps to ISectionProps for custom footnote styling
- Add blockquote styling with left indent and border.
- Indent: left `720`, hanging `360`
- Border: inset left border (`size: 20`, `space: 14`, `color: aaaaaa`)
- Produces visually distinct blockquotes with proper formatting

**Patch Changes**
- Fix stableSerialize to properly pass ignoreKeys parameter to getSerializableKeys function. Possibly leading to minor performance enhancement
- Fixes issue parsing markdown with multiple footnotes

### @m2d/image: 1.3.1 → 1.3.2

**Patch Changes**
- Remove `bmp` and `gif` fallback formats. These formats are not well supported on canvas, causing issues with our Canvas-based fallback conversion.

### @m2d/table: 0.0.7 → 0.1.1

**Minor Changes**
- Enhanced cell styling API with full docx.js integration and comprehensive formatting options
- Added `IFirstRowCellProps` and `ICellProps` interfaces with complete docx.js styling support
- Introduced `data` property providing full access to docx.js `IParagraphOptions` and `IRunOptions`
- Support for comprehensive text formatting: fonts, colors, sizes, bold, italics, underline, etc.
- Advanced paragraph styling: alignment, spacing, indentation, numbering, bullets
- Code block support with `pre` property for monospace formatting
- Deprecated direct `alignment` property in favor of `data.alignment`
- Enhanced documentation with detailed styling examples and docx.js integration guide
- Maintained backward compatibility with existing configurations

**Patch Changes**
- Remove deprecated alignment property from default firstRowCellProps
- fix: prevent variable reuse in table cell traversal
- Fixes [#14](https://github.com/md2docx/core/issues/14)
- Root cause: typo + missing `const` in `for (...)` loop caused accidental reuse of function arg (`node`).
- Fix: added `const` keyword and renamed the inner loop variable to avoid scope collision.
