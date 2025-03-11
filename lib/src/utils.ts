import {
  ExternalHyperlink,
  ImageRun,
  InternalHyperlink,
  IParagraphOptions,
  TextRun,
  Table,
  Paragraph,
} from "@mayank1513/docx";
import * as DOCX from "@mayank1513/docx";
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

type ExtendedRootContent = RootContent | { type: "" };

/**
 * Extracts the textual content from a given MDAST node.
 * Recursively processes child nodes if present.
 *
 * @param node - The MDAST node to extract text from.
 * @returns The combined text content of the node and its children.
 */
export const getTextContent = (node: ExtendedRootContent): string => {
  // If the node has children, process them recursively and concatenate their text.
  // @ts-expect-error - Ensuring only nodes with valid children are processed
  if (node.children?.length) return node.children.map(getTextContent).join("");

  // Return the node's value if it exists; otherwise, return an empty string.
  // @ts-expect-error - Overriding potential type mismatches
  return node.value ?? "";
};

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
   *
   */
  plugins?: IPlugin[];
}

/**
 * Default properties for MDAST to DOCX conversion.
 */

interface IDefaultMdastToDocxSectionProps extends IMdastToDocxSectionProps {
  useTitle: boolean;
  plugins: IPlugin[];
}

export const defaultProps: IDefaultMdastToDocxSectionProps = {
  useTitle: true,
  plugins: [],
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
  node: ExtendedRootContent,
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
  node: ExtendedRootContent,
  paraProps: Omit<MutableParaOptions, "children">,
) => Promise<(Paragraph | Table)[]>;

export type BlockNodeChildrenProcessor = (
  node: Parent | Root,
  paraProps: Omit<MutableParaOptions, "children">,
) => Promise<(Paragraph | Table)[]>;

/**
 * we deliberately pass the same instance of docx to the plugin as something fishi happens during the packaging step that creates an invalid document
 */
export interface IPlugin {
  block?: (
    docx: typeof DOCX,
    node: ExtendedRootContent,
    paraProps: Omit<MutableParaOptions, "children">,
    blockChildrenProcessor: BlockNodeChildrenProcessor,
    InlineChildrenProcessor: InlineChildrenProcessor,
  ) => Promise<(Paragraph | Table)[]>;
  inline?: (
    docx: typeof DOCX,
    node: ExtendedRootContent,
    parentSet: Set<InlineParentType>,
    definitions: Definitions,
    footnoteDefinitions: FootnoteDefinitions,
    inlineChildrenProcessor: InlineChildrenProcessor,
  ) => Promise<InlineDocxNodes[]>;
}

/**
 * @mayank/docx is a fork of the `docx` library with minor changes,
 * specifically exporting additional types that were not included in the original `docx` library.
 */
