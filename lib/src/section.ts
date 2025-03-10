import type { Root, RootContent, Parent, Table as MdTable } from "mdast";
import { defaultProps, getTextContent } from "./utils";
import type {
  Definitions,
  FootnoteDefinitions,
  ImageResolver,
  IMdastToDocxSectionProps,
} from "./utils";
import {
  Bookmark,
  BorderStyle,
  ExternalHyperlink,
  FootnoteReferenceRun,
  ImageRun,
  InternalHyperlink,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "@mayank1513/docx";
import type { IParagraphOptions, ISectionOptions } from "@mayank1513/docx";

/**
 * Defines properties for a document section, omitting the "children" property from ISectionOptions.
 */
export type ISectionProps = Omit<ISectionOptions, "children"> & IMdastToDocxSectionProps;

type InlineParentType = "strong" | "emphasis" | "delete" | "link";
type DocxTypoEmphasis = "bold" | "italics" | "strike";

/**
 * Creates an inline content processor that converts MDAST inline elements to DOCX-compatible runs.
 * @param definitions - Map of definitions
 * @param footnoteDefinitions - Map of footnote definitions
 * @param imageResolver - Function to resolve image URLs to IImageOptions
 * @returns Function that processes inline node children recursively
 */
const createInlineProcessor = (
  definitions: Definitions,
  footnoteDefinitions: FootnoteDefinitions,
  imageResolver: ImageResolver,
) => {
  const processInlineNode = async (
    node: RootContent,
    parentSet: Set<InlineParentType>,
  ): Promise<(TextRun | ImageRun | InternalHyperlink | ExternalHyperlink)[]> => {
    const newParentSet = new Set(parentSet);

    const decorations: Record<DocxTypoEmphasis, boolean> = {
      bold: parentSet.has("strong"),
      italics: parentSet.has("emphasis"),
      strike: parentSet.has("delete"),
    };

    // @ts-expect-error - node might not have url or identifier, but we are already handling those cases.
    const url = node.url ?? definitions[node.identifier?.toUpperCase()];
    // @ts-expect-error - node might not have alt
    const alt = node.alt ?? url?.split("/").pop();

    switch (node.type) {
      case "text":
        return [new TextRun({ text: node.value, ...decorations })];
      case "break":
        return [new TextRun({ break: 1 })];
      case "inlineCode":
        return [new TextRun({ text: node.value, ...decorations, style: "code" })];
      case "emphasis":
      case "strong":
      case "delete":
        newParentSet.add(node.type);
        return processInlineNodeChildren(node, newParentSet);
      case "link":
      case "linkReference":
        newParentSet.add("link");
        return [
          url.startsWith("#")
            ? new InternalHyperlink({
                anchor: url.slice(1),
                children: await processInlineNodeChildren(node, newParentSet),
              })
            : new ExternalHyperlink({
                link: url,
                children: await processInlineNodeChildren(node, newParentSet),
              }),
        ];
      case "image":
      case "imageReference":
        return [
          new ImageRun({
            ...(await imageResolver(url)),
            altText: { description: alt, name: alt, title: alt },
          }),
        ];
      case "footnoteReference":
        return [new FootnoteReferenceRun(footnoteDefinitions[node.identifier].id!)];
      default:
        return [new TextRun("")];
    }
  };

  const processInlineNodeChildren = async (
    node: Parent,
    parentSet: Set<InlineParentType> = new Set(),
  ) => (await Promise.all(node.children?.map(child => processInlineNode(child, parentSet)))).flat();

  return processInlineNodeChildren;
};

const createTable = async (
  node: MdTable,
  processInlineNodeChildren: (
    node: Parent,
    parentSet?: Set<InlineParentType>,
  ) => Promise<(TextRun | ImageRun | InternalHyperlink | ExternalHyperlink)[]>,
) => {
  const rows = await Promise.all(
    node.children.map(async row => {
      return new TableRow({
        children: await Promise.all(
          row.children.map(async cell => {
            return new TableCell({
              children: [new Paragraph({ children: await processInlineNodeChildren(cell) })],
            });
          }),
        ),
      });
    }),
  );
  return new Table({ rows });
};

/**
 * Mutable version of IParagraphOptions where all properties are writable.
 */
type MutableParaOptions = {
  -readonly [K in keyof IParagraphOptions]: IParagraphOptions[K];
};

/**
 * Converts an MDAST tree to a DOCX document section.
 * @param node - The root MDAST node
 * @param definitions - Definitions mapping
 * @param footnoteDefinitions - Footnote definitions mapping
 * @param props - Section properties (optional)
 * @returns A DOCX section representation
 */
export const toSection = async (
  node: Root,
  definitions: Definitions,
  footnoteDefinitions: FootnoteDefinitions,
  props?: ISectionProps,
) => {
  const { imageResolver, useTitle, ...sectionProps } = { ...defaultProps, ...props };

  const processInlineNodeChildren = createInlineProcessor(
    definitions,
    footnoteDefinitions,
    imageResolver,
  );

  const processBlockNode = async (
    node: RootContent,
    paraProps: Omit<MutableParaOptions, "children">,
  ): Promise<(Paragraph | Table)[]> => {
    // TODO: Verify correct calculation of bullet levels for nested lists and blockquotes.
    const newParaProps = Object.assign({}, paraProps);
    switch (node.type) {
      case "paragraph":
        return [new Paragraph({ ...paraProps, children: await processInlineNodeChildren(node) })];
      case "heading":
        return [
          new Paragraph({
            // @ts-expect-error - TypeScript does not infer depth to always be between 1 and 6, but it is ensured by MDAST specs
            heading: useTitle
              ? node.depth === 1
                ? "Title"
                : `Heading${node.depth - 1}`
              : `Heading${node.depth}`,
            children: [
              new Bookmark({
                id: getTextContent(node).replace(/[. ]+/g, "-").toLowerCase(),
                children: await processInlineNodeChildren(node),
              }),
            ],
          }),
        ];
      case "code":
        return [
          new Paragraph({
            alignment: "start",
            style: "blockCode",
            children: node.value.split("\n").map(
              line =>
                new TextRun({
                  text: line,
                  break: 1,
                  style: "code",
                }),
            ),
          }),
        ];
      case "list":
        if (node.ordered) {
          // newParaProps.numbering = {
          //   level: 0,
          //   reference: "num",
          // };
        } else {
          newParaProps.bullet = { level: (newParaProps.bullet?.level ?? 0) + 1 };
        }
      case "blockquote":
      case "listItem":
        return processBlockNodeChildren(node, newParaProps);
      case "thematicBreak":
        return [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6 } } })];
      case "definition":
      case "footnoteDefinition":
        return [];
      case "table":
        return [await createTable(node, processInlineNodeChildren)];
      case "tableRow":
      case "tableCell":
      case "yaml":
      case "html":
      default:
        console.warn(`Unsupported node type: ${node.type}`, node);
        return [];
    }
  };

  const processBlockNodeChildren = async (
    node: Root | Parent,
    paraProps: Omit<MutableParaOptions, "children">,
  ) => (await Promise.all(node.children?.map(child => processBlockNode(child, paraProps)))).flat();

  return { ...sectionProps, children: await processBlockNodeChildren(node, {}) };
};
