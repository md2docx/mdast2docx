import {
  ExternalHyperlink,
  IImageOptions,
  ImageRun,
  InternalHyperlink,
  IParagraphOptions,
  TextRun,
  Table,
  Paragraph,
} from "@mayank1513/docx";
import { BlockContent, DefinitionContent, Parent, Root, RootContent } from "mdast";
import { IDocxProps } from ".";
export { convertInchesToTwip, convertMillimetersToTwip } from "@mayank1513/docx";

/** Type representing definition mappings */
export type Definitions = Record<string, string>;

/** Type representing footnote definitions */
export type FootnoteDefinitions = Record<
  string,
  { children: (BlockContent | DefinitionContent)[]; id?: number }
>;

/**
 * Extracts definitions and footnote definitions from a list of MDAST nodes.
 * @param nodes - Array of MDAST nodes.
 * @returns An object containing `definitions` and `footnoteDefinitions`.
 */
export const getDefinitions = (nodes: RootContent[]) => {
  const definitions: Definitions = {};
  const footnoteDefinitions: FootnoteDefinitions = {};
  nodes.forEach(node => {
    if (node.type === "definition") {
      definitions[node.identifier.toUpperCase()] = node.url;
    } else if (node.type === "footnoteDefinition") {
      footnoteDefinitions[node.identifier.toUpperCase()] = { children: node.children };
      // @ts-expect-error - Ensuring only nodes with children are processed
    } else if (node.children?.length) {
      // @ts-expect-error - Recursively process only nodes with children
      Object.assign(definitions, getDefinitions(node.children));
    }
  });
  return { definitions, footnoteDefinitions };
};

/**
 * Extracts the textual content from a given MDAST node.
 * Recursively processes child nodes if present.
 *
 * @param node - The MDAST node to extract text from.
 * @returns The combined text content of the node and its children.
 */
export const getTextContent = (node: RootContent): string => {
  // If the node has children, process them recursively and concatenate their text.
  // @ts-expect-error - Ensuring only nodes with valid children are processed
  if (node.children?.length) return node.children.map(getTextContent).join("");

  // Return the node's value if it exists; otherwise, return an empty string.
  // @ts-expect-error - Overriding potential type mismatches
  return node.value ?? "";
};

/**
 * Type definition for an image resolver function.
 */
export type ImageResolver = (src: string) => Promise<IImageOptions>;

/**
 * Interface defining properties for MDAST to DOCX conversion.
 */
export interface IMdastToDocxSectionProps {
  /**
   * If true, H1 corresponds to the title, H2 to Heading1, etc.
   * @default true
   */
  useTitle?: boolean;

  /**
   * Custom image resolver function. Defaults to assuming client-side code.
   */
  imageResolver?: ImageResolver;
}

/**
 * Determines the MIME type of an image from its binary buffer.
 * @param buffer - The image buffer (ArrayBuffer or Buffer).
 * @returns The detected MIME type as a string.
 */
export function getImageMimeType(buffer: Buffer | ArrayBuffer) {
  const signatureLength = 4;
  const signatureArray = new Uint8Array(buffer).slice(0, signatureLength);

  if (signatureArray[0] === 66 && signatureArray[1] === 77) return "bmp";

  let signature = "";
  signatureArray.forEach(byte => {
    signature += byte.toString(16).padStart(2, "0");
  });

  switch (signature) {
    case "89504E47":
      return "png";
    case "47494638":
      return "gif";
    case "FFD8FFE0": // or other FFD8FF... signatures
    case "FFD8FFE1":
    case "FFD8FFE2":
    case "FFD8FFE3":
    case "FFD8FFE8":
      return "jpg";
  }
}

/** Scale factor for data images */
const DATA_IMG_SCALE = 3;

/**
 * Handles base64-encoded image URLs and converts them into image options.
 * @param src - The base64 image source.
 * @returns The image options with transformation details.
 */
const handleDataUrls = async (src: string): Promise<IImageOptions> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = new Image();
    img.src = src;
    await new Promise(resolve => {
      img.onload = resolve;
    });
    const width = img.width * DATA_IMG_SCALE;
    const height = img.height * DATA_IMG_SCALE;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return {
      data: canvas.toDataURL("image/png"),
      type: "png",
      transformation: {
        width: width / DATA_IMG_SCALE,
        height: height / DATA_IMG_SCALE,
      },
    };
  } else throw new Error("Canvas context not available");
};

/**
 * Fetches an image from a URL and extracts its options.
 * @param url - The image URL.
 * @returns The extracted image options.
 */
const handleNonDataUrls = async (url: string): Promise<IImageOptions> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = getImageMimeType(arrayBuffer) || "png";
  const imageBitmap = await createImageBitmap(new Blob([arrayBuffer], { type: mimeType }));

  return {
    type: mimeType,
    data: arrayBuffer,
    transformation: {
      width: imageBitmap.width,
      height: imageBitmap.height,
    },
  };
};

/**
 * Resolves an image URL (base64 or external) to the required format.
 * @param src - The image source URL.
 * @returns The resolved image options.
 */
const imageResolver: ImageResolver = async (src: string) => {
  try {
    if (src.startsWith("data:")) return await handleDataUrls(src);
    return await handleNonDataUrls(src);
  } catch (error) {
    console.error(`Error resolving image: ${src}`, error);
    return {
      type: "png",
      data: Buffer.from([]),
      transformation: {
        width: 100,
        height: 100,
      },
    };
  }
};

/**
 * Default properties for MDAST to DOCX conversion.
 */

interface IDefaultMdastToDocxSectionProps extends IMdastToDocxSectionProps {
  useTitle: boolean;
  imageResolver: ImageResolver;
}

export const defaultProps: IDefaultMdastToDocxSectionProps = {
  useTitle: true,
  imageResolver,
};

export const defaultDocumentProps: IDocxProps = {
  numbering: {
    config: [
      {
        reference: "num",
        levels: [
          {
            level: 0,
            format: "decimal",
            text: "%1.",
            alignment: "start",
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 },
              },
            },
          },
        ],
      },
    ],
  },
};

export type InlineParentType = "strong" | "emphasis" | "delete" | "link";
export type InlineDocxNodes = TextRun | ImageRun | InternalHyperlink | ExternalHyperlink;
export type InlineProcessor = (
  node: RootContent,
  parentSet: Set<InlineParentType>,
) => Promise<InlineDocxNodes[]>;

export type InlineChildrenProcessor = (
  node: Parent,
  parentSet?: Set<InlineParentType>,
) => Promise<InlineDocxNodes[]>;

/**
 * Mutable version of IParagraphOptions where all properties are writable.
 */
export type MutableParaOptions = {
  -readonly [K in keyof IParagraphOptions]: IParagraphOptions[K];
};

export type BlockNodeProcessor = (
  node: RootContent,
  paraProps: Omit<MutableParaOptions, "children">,
) => Promise<(Paragraph | Table)[]>;

export type BlockNodeChildrenProcessor = (
  node: Parent | Root,
  paraProps: Omit<MutableParaOptions, "children">,
) => Promise<(Paragraph | Table)[]>;

/**
 * @mayank/docx is a fork of the `docx` library with minor changes,
 * specifically exporting additional types that were not included in the original `docx` library.
 */
