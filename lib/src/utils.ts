import {
  ExternalHyperlink,
  ImageRun,
  InternalHyperlink,
  IParagraphOptions,
  TextRun,
  Table,
  Paragraph,
  IRunOptions,
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
 *
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
    } else if ((node as Parent).children?.length) {
      Object.assign(definitions, getDefinitions((node as Parent).children));
    }
  });
  return { definitions, footnoteDefinitions };
};

/** Type representing an extended RootContent node
 * - this type is used to avoid type errors when setting type to empty string (in case you want to avoid reprocessing that node.) in plugins
 */
type ExtendedRootContent = RootContent | { type: "" };

/**
 * Extracts the textual content from a given MDAST node.
 * Recursively processes child nodes if present.
 *
 * @param node - The MDAST node to extract text from.
 * @returns The combined text content of the node and its children.
 */
export const getTextContent = (node: ExtendedRootContent): string => {
  if ((node as Parent).children?.length)
    return (node as Parent).children.map(getTextContent).join("");

  return (node as { value?: string }).value ?? "";
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
   * List of plugins to extend conversion functionality.
   */
  plugins?: IPlugin[];
}

/**
 * Default configuration for converting MDAST to DOCX, including title handling and plugin extensions.
 */
interface IDefaultMdastToDocxSectionProps extends IMdastToDocxSectionProps {
  useTitle: boolean;
  plugins: IPlugin[];
}

export const defaultProps: IDefaultMdastToDocxSectionProps = {
  useTitle: true,
  plugins: [],
};

/**
 * Mutable version of IRunOptions where all properties are writable.
 */
export type MutableRunOptions = Omit<
  {
    -readonly [K in keyof IRunOptions]: IRunOptions[K];
  },
  "children"
>;

export type InlineParentType = "strong" | "emphasis" | "delete" | "link";
export type InlineDocxNodes = TextRun | ImageRun | InternalHyperlink | ExternalHyperlink;
export type InlineProcessor = (
  node: ExtendedRootContent,
  runProps: MutableRunOptions,
) => Promise<InlineDocxNodes[]>;

export type InlineChildrenProcessor = (
  node: Parent,
  runProps?: MutableRunOptions,
) => Promise<InlineDocxNodes[]>;

/**
 * Mutable version of IParagraphOptions where all properties are writable.
 */
export type MutableParaOptions = Omit<
  {
    -readonly [K in keyof IParagraphOptions]: IParagraphOptions[K];
  },
  "children"
>;

export type BlockNodeProcessor = (
  node: ExtendedRootContent,
  paraProps: MutableParaOptions,
) => Promise<(Paragraph | Table)[]>;

export type BlockNodeChildrenProcessor = (
  node: Parent | Root,
  paraProps: MutableParaOptions,
) => Promise<(Paragraph | Table)[]>;

/**
 * Interface for extending MDAST to DOCX conversion using plugins.
 */
export interface IPlugin {
  /**
   * Processes block-level nodes.
   */
  block?: (
    docx: typeof DOCX,
    node: ExtendedRootContent,
    paraProps: MutableParaOptions,
    blockChildrenProcessor: BlockNodeChildrenProcessor,
    inlineChildrenProcessor: InlineChildrenProcessor,
  ) => Promise<(Paragraph | Table)[]>;

  /**
   * Processes inline-level nodes.
   */
  inline?: (
    docx: typeof DOCX,
    node: ExtendedRootContent,
    parentSet: MutableRunOptions,
    definitions: Definitions,
    footnoteDefinitions: FootnoteDefinitions,
    inlineChildrenProcessor: InlineChildrenProcessor,
  ) => Promise<InlineDocxNodes[]>;

  /**
   * Allows plugins to modify document-level DOCX properties, such as styles, numbering, headers, and footers. This is useful for global formatting customizations.
   */
  root?: (props: IDocxProps) => void;
}

/**
 * @mayank/docx is a fork of the `docx` library with minor modifications,
 * primarily adding exports for additional types missing from the original `docx` library.
 */
