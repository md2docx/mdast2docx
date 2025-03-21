import { IPlugin, Mutable, standardizeColor } from "../utils";
import { Data, Heading, Image, Parent, PhrasingContent, RootContent } from "../mdast";
import { AlignmentType, BorderStyle, IBorderOptions } from "docx";

const INLINE_TAGS = ["BR", "IMG", "EM", "STRONG", "DEL", "A", "SUP", "SUB", "IMG"] as const;

const DOM_TO_MDAST_MAP = {
  BR: "break",
  IMG: "image",
  EM: "emphasis",
  STRONG: "strong",
  DEL: "delete",
  A: "link",
  SUP: "fragment",
  SUB: "fragment",
} as const;

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

type CssBorder = { width?: number; color?: string; style?: string };
type CssBorders = Partial<Record<"border" | "top" | "bottom" | "left" | "right", CssBorder>>;

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

// Example Usage:
// console.log(parseCssBorder("border-left: dashed 5px orange; border-right: 3px;"));
// console.log(parseCssBorder("border: 2px red dashed; border-top: solid blue 4px;"));
// console.log(parseCssBorder("border-bottom: 1px gray solid; border-top: none;"));
// console.log(parseCssBorder("border: none;"));

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

const parseStyles = (el: HTMLElement | SVGElement, inline = true): Data => {
  const data: Data = {};
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

  return data;
};

const processInlineDOMNode = (el: Node): PhrasingContent => {
  if (!(el instanceof HTMLElement || el instanceof SVGAElement))
    return { type: "text", value: el.textContent ?? "" };

  const children = Array.from(el.childNodes).map(processInlineDOMNode);
  const data = parseStyles(el);
  const attributes: Record<string, string> = el
    .getAttributeNames()
    .reduce((acc, cur) => ({ ...acc, [cur]: el.getAttribute(cur) }), {});

  if (el.tagName === "SUP") data.superScript = true;
  else if (el.tagName === "SUB") data.subScript = true;

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
    case "STRONG":
    case "DEL":
    case "SUP":
    case "SUB":
      return { type: DOM_TO_MDAST_MAP[el.tagName], children, data };
    case "A":
      return {
        type: "link",
        url: attributes.href ?? "",
        children,
        data,
      };
  }
  return { type: "fragment", children, data };
};

const processDOMNode = (el: HTMLElement | SVGElement): RootContent => {
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
    case "P":
      return {
        type: "paragraph",
        children: Array.from(el.childNodes).map(processInlineDOMNode),
        data,
      };
  }
  return { type: "paragraph", children: [{ type: "text", value: el.textContent ?? "" }] };
};

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
 * @beta
 * htmlPlugin is in beta and is subject to change or removal without notice.
 * This plugin is a placeholder for future implementation of HTML conversion.
 *
 * Keep this before image plugin to ensure inline html images are processed.
 */
export const htmlPlugin: () => IPlugin = () => {
  return {
    block: async (_docx, node) => {
      if (node.type === "html") {
        const el = document.createElement("div");
        el.innerHTML = node.value;
        const childNodes = Array.from(el.childNodes);
        const children: RootContent[] = [];
        const tmp: Node[] = [];
        for (const node of childNodes) {
          if (
            (node instanceof HTMLElement || node instanceof SVGAElement) &&
            !INLINE_TAGS.includes(node.tagName as (typeof INLINE_TAGS)[number])
          ) {
            if (tmp.length) {
              children.push({ type: "paragraph", children: tmp.map(processInlineDOMNode) });
              tmp.length = 0;
            }
            children.push(processDOMNode(node));
          } else tmp.push(node);
        }
        Object.assign(node, {
          type: "fragment",
          children,
        });
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
