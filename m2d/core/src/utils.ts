import {
  ExternalHyperlink,
  ImageRun,
  InternalHyperlink,
  IParagraphOptions,
  TextRun,
  Table,
  Paragraph,
  IRunOptions,
  IPropertiesOptions,
  Math as DOCXMath,
} from "docx";
import * as DOCX from "docx";
import { BlockContent, Data, DefinitionContent, Parent, Root, RootContent } from "@m2d/mdast";

export { convertInchesToTwip, convertMillimetersToTwip } from "docx";

export type Optional<T> = { [K in keyof T]?: T[K] };

export type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T> : T[K] };

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
type ExtendedRootContent<T extends { type: string; data?: Data } = { type: ""; data: Data }> =
  | RootContent
  | T;

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
 * Default configuration for converting MDAST to DOCX, including title handling and plugin extensions.
 */
interface IDefaultMdastToDocxSectionProps extends Omit<DOCX.ISectionOptions, "children"> {
  /**
   * If true, H1 corresponds to the title, H2 to Heading1, etc.
   * @default true
   */
  useTitle: boolean;

  /**
   * List of plugins to extend conversion functionality.
   */
  plugins: Array<IPlugin>;
}

/**
 * Defines properties for a document section, omitting the "children" property from ISectionOptions.
 * Also defining properties for MDAST to DOCX conversion
 */

export type ISectionProps = Optional<IDefaultMdastToDocxSectionProps>;

export const defaultSectionProps: IDefaultMdastToDocxSectionProps = {
  useTitle: true,
  plugins: [],
};

/**
 * Defines document properties, excluding sections and footnotes (which are managed internally).
 */
export type IDocxProps = Omit<Mutable<IPropertiesOptions>, "sections" | "footnotes">;

export const defaultDocxProps: IDocxProps = {
  styles: {
    default: {
      document: {
        paragraph: {
          spacing: { before: 175, line: 300 },
          alignment: "thaiDistribute",
        },
        run: { size: 24 },
      },
      heading1: { paragraph: { spacing: { before: 350 } } },
      heading2: { paragraph: { spacing: { before: 350 } } },
      heading3: { paragraph: { spacing: { before: 350 } } },
      heading4: { paragraph: { spacing: { before: 350 } } },
      heading5: { paragraph: { spacing: { before: 350 } } },
      heading6: { paragraph: { spacing: { before: 350 } } },
    },
  },
};

/**
 * Mutable version of IRunOptions where all properties are writable.
 */
export type MutableRunOptions = Mutable<Omit<IRunOptions, "children">> & { pre?: boolean };

export type InlineDocxNodes = TextRun | ImageRun | InternalHyperlink | ExternalHyperlink | DOCXMath;
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
export type MutableParaOptions = Omit<Mutable<IParagraphOptions>, "children"> & {
  checked?: boolean | null;
  pre?: boolean;
};

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
export interface IPlugin<T extends { type: string } = { type: "" }> {
  /**
   * Processes block-level nodes.
   */
  block?: (
    docx: typeof DOCX,
    node: ExtendedRootContent<T>,
    paraProps: MutableParaOptions,
    blockChildrenProcessor: BlockNodeChildrenProcessor,
    inlineChildrenProcessor: InlineChildrenProcessor,
  ) => Promise<(Paragraph | Table)[]>;

  /**
   * Processes inline-level nodes.
   */
  inline?: (
    docx: typeof DOCX,
    node: ExtendedRootContent<T>,
    runProps: MutableRunOptions,
    definitions: Definitions,
    footnoteDefinitions: FootnoteDefinitions,
    inlineChildrenProcessor: InlineChildrenProcessor,
  ) => Promise<InlineDocxNodes[]>;

  /**
   * Allows plugins to modify document-level DOCX properties, such as styles, numbering, headers, and footers. This is useful for global formatting customizations.
   */
  root?: (props: IDocxProps) => void;
  /**
   * Preprocess mdast tree before conversion
   */
  preprocess?: (tree: Root) => void;
}

/**
 * @mayank/docx is a fork of the `docx` library with minor modifications,
 * primarily adding exports for additional types missing from the original `docx` library.
 */
