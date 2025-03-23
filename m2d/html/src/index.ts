import {
  IPlugin,
  Mutable,
  Data,
  Heading,
  Image,
  Parent,
  PhrasingContent,
  RootContent,
  BlockContent,
  TableRow,
} from "@m2d/core";
import { standardizeColor } from "./utils";
import {
  AlignmentType,
  BorderStyle,
  FrameAnchorType,
  HorizontalPositionAlign,
  IBorderOptions,
  VerticalPositionAlign,
} from "docx";

/**
 * HTML inline tags supported by the plugin for conversion.
 */
const INLINE_TAGS = [
  "BR",
  "IMG",
  "EM",
  "I",
  "STRONG",
  "B",
  "DEL",
  "S",
  "A",
  "SUP",
  "SUB",
  "IMG",
] as const;

/**
 * Mapping of DOM tag names to MDAST node types.
 */
const DOM_TO_MDAST_MAP = {
  BR: "break",
  IMG: "image",
  EM: "emphasis",
  I: "emphasis",
  STRONG: "strong",
  B: "strong",
  DEL: "delete",
  S: "delete",
  A: "link",
} as const;

/**
 * CSS border styles that are recognized for conversion.
 */
const CSS_BORDER_STYLES = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "none",
  "ridge",
  "groove",
  "inset",
  "outset",
];

/**
 * Parsed CSS border representation.
 */
type CssBorder = { width?: number; color?: string; style?: string };

/**
 * Border settings parsed from individual sides.
 */
type CssBorders = Partial<Record<"border" | "top" | "bottom" | "left" | "right", CssBorder>>;

/**
 * Extracts individual border styles from a CSS style string.
 *
 * @param borderString - Raw style string from the `style` attribute.
 * @returns Parsed border information by edge.
 */
const parseCssBorders = (borderString: string | null): CssBorders => {
  if (!borderString) return {};
  const borders: CssBorders = {};

  // Match individual border properties (border-left, border-right, etc.)
  const borderMatches = borderString.match(/border(-\w+)?:\s*[^;]+/gi);
  if (!borderMatches) return {};

  for (const match of borderMatches) {
    const [property, value] = match.split(":").map(s => s.trim());
    const parts = value.split(/\s+/);

    // Extract width, style, and color
    const width = parts.find(p => p.endsWith("px"))?.replace("px", "");
    const style = parts.find(p => CSS_BORDER_STYLES.includes(p.toLowerCase()));
    const color = parts.find(
      p => !p.endsWith("px") && !CSS_BORDER_STYLES.includes(p.toLowerCase()),
    );

    // Determine border key (e.g., borderLeft, borderTop)
    const key = property === "border" ? "border" : property.replace("border-", "");

    // Assign parsed values to the correct property
    borders[key as keyof CssBorders] = {
      ...(width ? { width: parseInt(width, 1) } : {}),
      ...(style ? { style } : {}),
      ...(color ? { color } : {}),
    };
  }

  return borders;
};

/**
 * Maps CSS border styles to docx-compatible border styles.
 */
const STYLE_MAP = {
  solid: BorderStyle.SINGLE,
  dashed: BorderStyle.DASHED,
  dotted: BorderStyle.DOTTED,
  double: BorderStyle.DOUBLE,
  none: BorderStyle.NONE,
  ridge: BorderStyle.THREE_D_EMBOSS,
  groove: BorderStyle.THREE_D_ENGRAVE,
  inset: BorderStyle.INSET,
  outset: BorderStyle.OUTSET,
} as const;

/**
 * Converts a parsed CSS border to a docx-compatible IBorderOptions.
 *
 * @param cssBorder - Parsed border properties.
 * @returns docx-compatible border settings or undefined.
 */
const getDocxBorder = (cssBorder?: CssBorder) => {
  if (!cssBorder || !Object.keys(cssBorder).length) return undefined;
  const { width, color, style } = cssBorder;
  const border: Mutable<IBorderOptions> = {
    style: style ? STYLE_MAP[style as keyof typeof STYLE_MAP] : BorderStyle.SINGLE,
  };
  if (width) border.size = width;
  if (color) border.color = standardizeColor(color);
  return border;
};

/**
 * Parses inline or block style metadata from a DOM node.
 *
 * @param el - DOM element to extract style from.
 * @param inline - Flag indicating if the style is for inline content.
 * @returns Style metadata as `Data`.
 * skipcq: JS-R1005
 */
const parseStyles = (el: Node, inline = true): Data => {
  const data: Data = {};
  if (!(el instanceof HTMLElement || el instanceof SVGElement)) return data;
  const { textAlign, fontWeight, fontStyle, textDecoration, textTransform, color } = el.style;
  const borders = parseCssBorders(el.getAttribute("style"));
  if (inline && borders.border) {
    data.border = getDocxBorder(borders.border);
  } else if (Object.keys(borders).length) {
    const leftBorder = { ...borders.border, ...borders.left };
    const rightBorder = { ...borders.border, ...borders.right };
    const topBorder = { ...borders.border, ...borders.top };
    const bottomBorder = { ...borders.border, ...borders.bottom };
    data.border = {
      left: getDocxBorder(leftBorder),
      right: getDocxBorder(rightBorder),
      top: getDocxBorder(topBorder),
      bottom: getDocxBorder(bottomBorder),
    };
  }

  if (textAlign) {
    if (Object.keys(AlignmentType).includes(textAlign))
      data.alignment = textAlign as (typeof AlignmentType)[keyof typeof AlignmentType];
    else if (textAlign === "justify") data.alignment = AlignmentType.JUSTIFIED;
  }

  if (/bold/.test(fontWeight) || parseInt(fontWeight) >= 500) data.bold = true;

  if (/(italic|oblique)/.test(fontStyle)) data.italics = true;

  switch (textDecoration) {
    case "underline":
      data.underline = {};
      break;
    case "overline":
      data.emphasisMark = {};
      break;
    case "line-through":
      data.strike = true;
      break;
  }

  if (textTransform === "uppercase") data.allCaps = true;

  if (textTransform === "lowercase") data.smallCaps = true;

  if (color) data.color = standardizeColor(color);

  if (el.tagName === "SUP") data.superScript = true;
  else if (el.tagName === "SUB") data.subScript = true;
  else if (["STRONG", "B"].includes(el.tagName)) data.bold = true;
  else if (["EM", "I"].includes(el.tagName)) data.italics = true;
  else if (["DEL", "S"].includes(el.tagName)) data.strike = true;
  else if (["U", "INS"].includes(el.tagName)) data.underline = {};
  else if (el.tagName === "MARK") {
    data.highlight = "yellow";
    data.emphasisMark = {};
  } else if (el.tagName === "PRE") {
    data.pre = true;
  }

  return data;
};

/**
 * Converts an inline HTML DOM node into MDAST `PhrasingContent`.
 *
 * @param el - DOM node to process.
 * @returns PhrasingContent-compatible node.
 */
const processInlineDOMNode = (el: Node): PhrasingContent => {
  if (!(el instanceof HTMLElement || el instanceof SVGElement))
    return { type: "text", value: el.textContent ?? "" };

  const children = Array.from(el.childNodes).map(processInlineDOMNode);
  const data = parseStyles(el);
  const attributes: Record<string, string> = el
    .getAttributeNames()
    .reduce((acc, cur) => ({ ...acc, [cur]: el.getAttribute(cur) }), {});

  switch (el.tagName) {
    case "BR":
      return { type: "break" };
    case "IMG":
      return {
        type: "image",
        url: attributes.src ?? "",
        alt: attributes.alt ?? "",
        data: { ...data, ...attributes },
      } as Image;
    case "SVG":
      return {
        type: "image",
        url: `data:image/svg+xml;base64,${el.outerHTML}`,
        data,
      } as Image;
    case "EM":
    case "I":
    case "STRONG":
    case "B":
    case "DEL":
    case "S":
      return { type: DOM_TO_MDAST_MAP[el.tagName], children, data };
    case "A":
      return {
        type: "link",
        url: attributes.href ?? "",
        children,
        data,
      };
    case "INPUT":
      if (/(radio|checkbox)/.test((el as HTMLInputElement).type)) return { type: "checkbox" };
  }
  return { type: "fragment", children, data };
};

/**
 * Converts DOM structure into a paragraph or fragment of block nodes.
 *
 * @param el - Root DOM node to process.
 * @param data - Optional metadata to apply.
 * @returns A BlockContent node or fragment node.
 */
const createFragmentWithParentNodes = (el: Node, data?: Data): BlockContent => {
  const childNodes = Array.from(el.childNodes);
  const children: BlockContent[] = [];
  const tmp: Node[] = [];
  for (const node of childNodes) {
    if (
      (node instanceof HTMLElement || node instanceof SVGElement) &&
      !INLINE_TAGS.includes(node.tagName as (typeof INLINE_TAGS)[number])
    ) {
      if (tmp.length) {
        children.push({ type: "paragraph", children: tmp.map(processInlineDOMNode) });
        tmp.length = 0;
      }
      // skipcq: JS-0357
      children.push(processDOMNode(node));
    } else tmp.push(node);
  }
  if (tmp.length) children.push({ type: "paragraph", children: tmp.map(processInlineDOMNode) });
  return children.length === 1
    ? { ...children[0], data: { ...data, ...children[0].data } }
    : {
        type: "fragment",
        children,
        data,
      };
};

/**
 * Generates MDAST `tableRow` nodes from DOM table rows.
 *
 * @param el - Table DOM node.
 * @param data_ - Optional style metadata.
 * @returns List of table rows.
 */
const createRows = (el: HTMLElement, data_?: Data): TableRow[] =>
  Array.from(el.children)
    .map(tr => {
      const data = { ...data_, ...parseStyles(tr as HTMLElement) };
      return tr instanceof HTMLTableRowElement
        ? ({
            type: "tableRow",
            children: Array.from(tr.children).map(col => ({
              type: "tableCell",
              children: [processInlineDOMNode(col)],
            })),
            data,
          } as TableRow)
        : createRows(tr as HTMLElement, data);
    })
    .flat();

/**
 * Default table border style for DOCX tables.
 */
const border: IBorderOptions = { style: "single" };
const defaultBorder = { left: border, right: border, top: border, bottom: border };

/**
 * Converts block-level HTML elements into MDAST `BlockContent` nodes.
 *
 * @param el - HTML or SVG element to process.
 * @returns Converted block content node.
 */
const processDOMNode = (el: HTMLElement | SVGElement): BlockContent => {
  const data = parseStyles(el);
  switch (el.tagName) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
      return {
        type: "heading",
        depth: parseInt(el.tagName[1]),
        children: Array.from(el.childNodes).map(processInlineDOMNode),
        data,
      } as Heading;
    case "PRE":
    case "P":
    case "DIV":
    case "DETAILS":
    case "SUMMARY":
    case "FORM":
    case "LI":
      return createFragmentWithParentNodes(el, data);
    case "UL":
    case "OL":
      return {
        type: "list",
        ordered: el.tagName === "OL",
        children: Array.from(el.childNodes).map(node => ({
          type: "listItem",
          children: [createFragmentWithParentNodes(node)],
          data,
        })),
      };
    case "HR":
      return { type: "thematicBreak", data };
    case "BLOCKQUOTE":
      return {
        type: "blockquote",
        children: Array.from(el.childNodes).map(node => createFragmentWithParentNodes(node)),
        data,
      };
    case "TABLE": {
      const children = createRows(el as HTMLElement);
      return {
        type: "table",
        children,
        data,
      };
    }
    case "STYLE":
      return {
        type: "paragraph",
        children: [{ type: "text", value: `Not supported yet!\n\n${el.textContent}` }],
        data: { ...data, pre: true, border: defaultBorder },
      };
    case "INPUT":
      if (!/(radio|checkbox)/.test((el as HTMLInputElement).type)) {
        return {
          type: "paragraph",
          children: [],
          data: {
            ...data,
            frame: {
              width: 5000,
              height: 90,
              alignment: { x: HorizontalPositionAlign.LEFT, y: VerticalPositionAlign.CENTER },
              anchor: {
                horizontal: FrameAnchorType.TEXT,
                vertical: FrameAnchorType.TEXT,
              },
              type: "alignment",
            },
            border: defaultBorder,
          },
        };
      }
  }
  return { type: "paragraph", children: [processInlineDOMNode(el)], data };
};

/**
 * Consolidates inline HTML tag children inside valid tag-matching groups.
 *
 * @param pNode - MDAST parent node.
 */
const consolidateInlineHTML = (pNode: Parent) => {
  const children: RootContent[] = [];
  const htmlNodeStack: (Parent & { tag: string })[] = [];
  for (const node of pNode.children) {
    if ((node as Parent).children?.length) consolidateInlineHTML(node as Parent);
    // match only inline non-self-closing html nodes.
    if (node.type === "html" && /^<[^>]*[^/]>$/.test(node.value)) {
      const tag = node.value.split(" ")[0].slice(1);
      // ending tag
      if (tag[0] === "/") {
        if (htmlNodeStack[0]?.tag === tag.slice(1, -1))
          children.push(htmlNodeStack.shift() as RootContent);
      } else {
        htmlNodeStack.unshift({ ...node, children: [], tag });
      }
    } else if (htmlNodeStack.length) {
      htmlNodeStack[0].children.push(node);
    } else {
      children.push(node);
    }
  }
  pNode.children = children;
};

/**
 * HTML plugin for MDAST-to-DOCX conversion.
 * Converts inline and block-level HTML content within markdown into structured MDAST nodes.
 *
 * Supports `<br>`, `<img>`, `<strong>`, `<em>`, `<table>`, `<ul>`, `<input>`, and other inline tags.
 * Should be used before `image`, `table`, or other content plugins in the pipeline.
 *
 * @returns Configured HTML plugin for MDAST parsing.
 */
export const htmlPlugin: () => IPlugin = () => {
  return {
    block: async (_docx, node) => {
      if (node.type === "html") {
        const el = document.createElement("div");
        el.innerHTML = node.value;

        Object.assign(node, createFragmentWithParentNodes(el));
      }
      return [];
    },
    inline: async (_docx, node) => {
      if (node.type === "html") {
        const value = node.value?.trim() ?? "";
        const tag = value.split(" ")[0].slice(1);
        const el = document.createElement("div");
        el.innerHTML = value.endsWith("/>") ? value : `${value}</${tag}>`;
        // @ts-expect-error - changing node type here.
        Object.assign(node, { ...processInlineDOMNode(el.children[0]), children: node.children });
      }
      return [];
    },
    preprocess: consolidateInlineHTML,
  };
};
