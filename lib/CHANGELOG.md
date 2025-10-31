# mdast2docx

## 1.6.1

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/core: 1.7.0 → 1.7.1

  **Patch Changes**

  - Fix potential crash when footnote definition is undefined

  ### @m2d/html: 1.1.10 → 1.1.11

  **Patch Changes**

  - Prevent hard failure when parsing content with invalid html tags

  ### @m2d/image: 1.4.0 → 1.4.1

  ### @m2d/list: 0.0.8 → 0.0.9

  **Patch Changes**

  - fix(list): restart ordered lists at `1.` instead of continuing numbering across lists

## 1.6.0

### Minor Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/image: 1.3.2 → 1.4.0

  **Minor Changes**

  - ✨ Added `quality` option for image conversion.
  - Defaults to **0.92**.
  - Used only when conversion is required **and** the output format is lossy (e.g., JPEG).

  **Patch Changes**

  - Improve SVG → image conversion by preferring **OffscreenCanvas** over `<canvas>` when available.
  - OffscreenCanvas advantages:
  - Runs in worker contexts → avoids blocking the main thread during rasterization.
  - Provides more consistent and reliable Blob generation compared to `HTMLCanvasElement.toBlob`.
  - Better performance for large or complex SVGs.
  - Fallback to `<canvas>` remains for browsers without OffscreenCanvas support (e.g., Safari).

## 1.5.1

### Patch Changes

- 780e66a: Fix exports

## 1.5.0

### Minor Changes

- dcae066: The following @m2d/\* dependencies were upgraded:

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

## 1.4.2

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/html: 1.1.8 → 1.1.10

  **Patch Changes**

  - fix text alignment
  - Fix: fix an edge case where build might fail if the mermaid or similar plugin comes before htmlPlugin

## 1.4.1

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/html: 1.1.7 → 1.1.8

  **Patch Changes**

  - Fix HTML parsing issues in case of empty tags.

## 1.4.0

### Minor Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/core: 1.4.2 → 1.5.0

  **Minor Changes**

  - feat: add trimInnerSpaces option to section processing for whitespace normalization

  **Patch Changes**

  - Attempt to keep entire code block on same page.
  - feat/utils: add mergeOptions function for deep merging user and default options

  ### @m2d/table: 0.0.6 → 0.0.7

  **Minor Changes**

  - Support block elements inside table cell, e.g., table inside table

  **Patch Changes**

  - refactor: enhance table plugin options merging and alignment handling - headers can now be aligned independent of rest of table
  - Update types

## 1.3.5

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/math: 0.0.5 → 0.0.6

  **Patch Changes**

  - Keep enough metadata for JSX creation.
  - Upgrade core package to v1

## 1.3.4

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/html: 1.1.6 → 1.1.7

  **Patch Changes**

  - fix: td or th tags should be lowercase

## 1.3.3

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/html: 1.1.5 → 1.1.6

  **Patch Changes**

  - Fix tags

## 1.3.2

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/html: 1.1.3 → 1.1.5

  **Patch Changes**

  - fix: INPUT element style parsing
  - fix: Extract styles in createFragmentWithParentNodes as well to avoid misleading data.

## 1.3.1

### Patch Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/core: 1.4.1 → 1.4.2

  **Patch Changes**

  - Expand data type to handle more of HTML Input element data.

  ### @m2d/html: 1.1.2 → 1.1.3

  **Patch Changes**

  - fix: Improve HTML Input element handling
  - Update types

## 1.3.0

### Minor Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/core: 1.2.0 → 1.4.1

  **Minor Changes**

  - Refactored `createPersistentCache` to accept a `config` object for optional settings.
  - **In-memory cache sharing**: Pass a shared cache object to coordinate between modules or tabs.
  - **Configurable cache strategies**:
  - `cacheTarget`: choose where data is stored — RAM, IndexedDB, or both.
  - `parallel`: race compute and read to optimize latency.
  - Update types to ensure sufficient data for converting to jsx
  - refactor plugin interface to update postprocess hook. Since there is very limited scope for utilizing the document object once creted, we are moving the postprocess hook to be called just before creating the document object. It gets list of sections which can be finished up just before converting to docx.

  **Patch Changes**

  - Better type safety and minor rename cacheTarget to cacheMode
  - fix: Bring back the Extended Node support and default to EmptyNode
  - Simplify types.
  - fix: Update types for supporting HTML and advanced tables
  - fix tag types in node data

  ### @m2d/emoji: 0.1.2 → 0.1.3

  _No changelog available._

  ### @m2d/html: 1.0.3 → 1.1.2

  **Minor Changes**

  - Support block node inside table cells. Add tag to data for easy JSX creation

  **Patch Changes**

  - fix advanced table handling
  - fix: empty HTML table cells

  ### @m2d/image: 1.2.0 → 1.3.1

  **Minor Changes**

  - Added support for optimized in-memory caching of resolved image data.
  - Introduced `cacheConfig.cache` option to share or inject a memory cache instance across multiple plugin invocations.
  - Consumers can now fine-tune cache behavior using `cacheConfig.parallel` (to avoid redundant parallel resolutions) and `cacheConfig.cacheMode` (choose between `"memory"`, `"idb"`, or `"both"`).
  - Enhances image resolution performance in multi-page or repeated image scenarios, especially when used across sessions or documents.

  **Patch Changes**

  - provide cache field to avoid entire cacheConfig option for simple cache sharing optimizations.
  - Store type in \_type for conversion to JSX

  ### @m2d/list: 0.0.7 → 0.0.8

  **Patch Changes**

  - Ensure enough data is available on node after processing to convert to JSX.

  ### @m2d/mermaid: 1.1.4 → 1.2.2

  **Minor Changes**

  - Added support for optimized in-memory caching of resolved mermaid data.
  - Introduced `cacheConfig.cache` option to share or inject a memory cache instance across multiple plugin invocations.
  - Consumers can now fine-tune cache behavior using `cacheConfig.parallel` (to avoid redundant parallel resolutions) and `cacheConfig.cacheMode` (choose between `"memory"`, `"idb"`, or `"both"`).
  - Enhances mermaid resolution performance in multi-page or repeated mermaid scenarios, especially when used across sessions or documents.

  **Patch Changes**

  - fix: handle edgecase when cache is deleberately set to null.
  - provide cache field to avoid entire cacheConfig option for simple cache sharing optimizations.
  - Update types to be competible with the rest of the ecosystem.

## 1.2.0

### Minor Changes

- The following @m2d/\* dependencies were upgraded:

  ### @m2d/image: 1.1.2 → 1.2.0

  **Minor Changes**

  - Add configurable SVG rendering fixes to improve diagram rendering, particularly for Mermaid pie charts. Extract SVG fixes into a separate exportable function that can be customized through plugin options.

  **Patch Changes**

  - fix: Mermaid title alignment in pie chart

### Patch Changes

- b13abcf: Update image plugin

## 1.1.1

### Patch Changes

- b199e3f: Do cache cleanup in postprocess hook

## 1.1.0

### Minor Changes

- 8aeb718: Add caching to indexeddb

## 1.0.0

### Major Changes

- 5410f96: Upgrade to V1 - @see - https://github.com/md2docx/mdast2docx/discussions/15

## 0.4.3

### Patch Changes

- 9a33851: Update types and add image placeholder option

## 0.4.2

### Patch Changes

- 8eeb789: Enhance: Allow to provide placeholder image when not able to fetch image or some error.

## 0.4.1

### Patch Changes

- 71cec57: fix types

## 0.4.0

### Minor Changes

- a942bef: Add mermaidPlugin and improve image and html processing

## 0.3.6

### Patch Changes

- f1cab43: Make docx as dependency instead of peer-dependency

## 0.3.5

### Patch Changes

- f24fdf2: Fix the workspace:\* deps
- Updated dependencies [f24fdf2]
  - @m2d/core@0.0.3
  - @m2d/html@0.0.3
  - @m2d/image@0.0.3
  - @m2d/list@0.0.3
  - @m2d/math@0.0.3
  - @m2d/table@0.0.3

## 0.3.4

### Patch Changes

- ba94e11: Fix deps

## 0.3.3

### Patch Changes

- 2673cbc: Update dependencies
- Updated dependencies [2673cbc]
- Updated dependencies [b14ade1]
  - @m2d/core@0.0.1
  - @m2d/html@0.0.1
  - @m2d/image@0.0.1
  - @m2d/list@0.0.1
  - @m2d/math@0.0.1
  - @m2d/table@0.0.1

## 0.3.2

### Patch Changes

- 2bd9f79: Fix package versions

## 0.3.1

### Patch Changes

- 66454f4: Use scooped packages.

## 0.3.0

### Minor Changes

- 584ceec: Add preprocess function to plugins. This will allow for pre-processing the MDAST before conversion.

## 0.2.0

### Minor Changes

- 3216d1e: Add experimental support for html

### Patch Changes

- 8cdd4c0: Use docx in place of @mayank1513/docx as updates accepted by docx
- 294d9d9: Allow passing custom image resolver

## 0.1.0

### Minor Changes

- 1e7121b: Support multiple image formats for fallback image type.

### Patch Changes

- e64c600: Improve Math parsing with latex

## 0.0.0

### Minor Changes

- b64200d: Add basic version of mathPlugin - will add support for latex, etc. soon!
- 78640db: Add Plugins for table, list, image

### Patch Changes

- 6c9a42b: First beta release
- bd7b602: Fix internal hyperlinks - create bookmark without #
- 9924936: Support tables - we do not support nested tables as it is not supported by MDAST

## 0.0.1-beta.0

### Patch Changes

- 6c9a42b: First beta release
