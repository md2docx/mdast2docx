import type { Root, RootContent, Parent } from "mdast";
import { defaultProps } from "./utils";
import type {
  Definitions,
  FootnoteDefinitions,
  ImageResolver,
  IMdastToDocxSectionProps,
} from "./utils";
import {
  BorderStyle,
  ExternalHyperlink,
  FootnoteReferenceRun,
  ImageRun,
  InternalHyperlink,
  Paragraph,
  TextRun,
} from "@mayank1513/docx";
import type { IParagraphOptions, ISectionOptions } from "@mayank1513/docx";

/**
 * Defines properties for a document section, omitting the "children" property from ISectionOptions.
 */
export type ISectionProps = Omit<ISectionOptions, "children"> & IMdastToDocxSectionProps;

type InlineParentType = "strong" | "emphasis" | "delete" | "link";
type DocxTypoEmphasis = "bold" | "italics" | "strike";

type BlockParentType = "blockquote" | "list" | "listItem";

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
                anchor: url,
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
    parents: BlockParentType[],
  ): Promise<Paragraph[]> => {
    const newParents = [...parents];
    // TODO: Verify correct calculation of bullet levels for nested lists and blockquotes.
    const paraProps: Omit<MutableParaOptions, "children"> = {};
    if (parents.includes("list")) {
      paraProps.bullet = { level: parents.filter(parent => parent === "list").length - 1 };
    }
    if (parents.includes("blockquote")) {
      paraProps.style = "Quote";
    }
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
            children: await processInlineNodeChildren(node),
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
      case "blockquote":
      case "listItem":
        newParents.push(node.type);
        return processBlockNodeChildren(node, newParents);
      case "thematicBreak":
        return [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6 } } })];
      case "table":
      case "tableRow":
      case "tableCell":
      case "yaml":
      case "html":
      default:
        console.warn(`Unsupported node type: ${node.type}`, node);
        return [];
    }
  };

  const processBlockNodeChildren = async (node: Root | Parent, parents: BlockParentType[]) =>
    (await Promise.all(node.children?.map(child => processBlockNode(child, parents)))).flat();

  return { ...sectionProps, children: await processBlockNodeChildren(node, []) };
};
