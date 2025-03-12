import type { Root, Table as MdTable } from "mdast";
import { defaultProps, getTextContent } from "./utils";
import type {
  BlockNodeChildrenProcessor,
  BlockNodeProcessor,
  Definitions,
  FootnoteDefinitions,
  IMdastToDocxSectionProps,
  InlineChildrenProcessor,
  InlineDocxNodes,
  InlineProcessor,
  IPlugin,
} from "./utils";
import {
  Bookmark,
  BorderStyle,
  ExternalHyperlink,
  FootnoteReferenceRun,
  InternalHyperlink,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "@mayank1513/docx";
import type { ISectionOptions } from "@mayank1513/docx";
import * as docx from "@mayank1513/docx";

/**
 * Defines properties for a document section, omitting the "children" property from ISectionOptions.
 */
export type ISectionProps = Omit<ISectionOptions, "children"> & IMdastToDocxSectionProps;

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
  plugins: IPlugin[],
) => {
  const processInlineNode: InlineProcessor = async (node, runProps) => {
    const newRunProps = Object.assign({}, runProps);

    const docxNodes: InlineDocxNodes[] = (
      await Promise.all(
        plugins.map(
          plugin =>
            plugin.inline?.(
              docx,
              node,
              newRunProps,
              definitions,
              footnoteDefinitions,
              processInlineNodeChildren,
            ) ?? [],
        ),
      )
    ).flat();

    // @ts-expect-error - node might not have url or identifier, but we are already handling those cases.
    const url = node.url ?? definitions[node.identifier?.toUpperCase()];

    switch (node.type) {
      case "text":
        return [...docxNodes, new TextRun({ text: node.value, ...newRunProps })];
      case "break":
        return [...docxNodes, new TextRun({ break: 1 })];
      case "inlineCode":
        return [...docxNodes, new TextRun({ text: node.value, ...newRunProps, style: "code" })];
      case "emphasis":
        newRunProps.italics = true;
        return [...docxNodes, ...(await processInlineNodeChildren(node, newRunProps))];
      case "strong":
        newRunProps.bold = true;
        return [...docxNodes, ...(await processInlineNodeChildren(node, newRunProps))];
      case "delete":
        newRunProps.strike = true;
        return [...docxNodes, ...(await processInlineNodeChildren(node, newRunProps))];
      case "link":
      case "linkReference":
        // newRunProps.add("link");
        // newRunProps.style = "link";
        return [
          ...docxNodes,
          url.startsWith("#")
            ? new InternalHyperlink({
                anchor: url.slice(1),
                children: await processInlineNodeChildren(node, newRunProps),
              })
            : new ExternalHyperlink({
                link: url,
                children: await processInlineNodeChildren(node, newRunProps),
              }),
        ];
      case "footnoteReference":
        return [
          ...docxNodes,
          new FootnoteReferenceRun(footnoteDefinitions[node.identifier].id ?? 0),
        ];
      // Already handled by a plugin
      // case "": //<- no need -- just for clarity
      default:
        return [...docxNodes];
    }
  };

  const processInlineNodeChildren: InlineChildrenProcessor = async (node, parentSet = new Set()) =>
    (await Promise.all(node.children?.map(child => processInlineNode(child, parentSet)))).flat();

  return processInlineNodeChildren;
};

const createTable = async (node: MdTable, processInlineNodeChildren: InlineChildrenProcessor) => {
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
  const { plugins, useTitle, ...sectionProps } = { ...defaultProps, ...props };

  const processInlineNodeChildren = createInlineProcessor(
    definitions,
    footnoteDefinitions,
    plugins,
  );

  const processBlockNode: BlockNodeProcessor = async (node, paraProps) => {
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
      case "yaml":
      case "html":
      default:
        console.warn(`Unsupported node type: ${node.type}`, node);
        return [];
    }
  };

  const processBlockNodeChildren: BlockNodeChildrenProcessor = async (node, paraProps) =>
    (await Promise.all(node.children?.map(child => processBlockNode(child, paraProps)))).flat();

  return { ...sectionProps, children: await processBlockNodeChildren(node, {}) };
};
