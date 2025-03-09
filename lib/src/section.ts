import { Root, RootContent } from "mdast";
import { defaultProps, getDefinitions, ImageResolver, IMdastToDocxSectionProps } from "./utils";
import {
  BorderStyle,
  ExternalHyperlink,
  ImageRun,
  InternalHyperlink,
  IParagraphOptions,
  ISectionOptions,
  Paragraph,
  TextRun,
} from "@mayank1513/docx";

export type ISectionProps = Omit<ISectionOptions, "children"> & IMdastToDocxSectionProps;

type InlineParentType = "strong" | "emphasis" | "delete" | "link";
type DocxTypoEmphasis = "bold" | "italics" | "strike";

type BlockParentType = "blockquote" | "list" | "listItem";

const createInlineProcessor = (
  definitions: Record<string, string>,
  imageResolver: ImageResolver,
) => {
  const processInlineNode = async (
    node: RootContent,
    parentSet: Set<InlineParentType> = new Set(),
  ): Promise<(TextRun | ImageRun | InternalHyperlink | ExternalHyperlink)[]> => {
    const parentSet1 = new Set(parentSet);

    const decorations: Record<DocxTypoEmphasis, boolean> = {
      bold: parentSet.has("strong"),
      italics: parentSet.has("emphasis"),
      strike: parentSet.has("delete"),
    };

    // @ts-expect-error - ok
    const url = node.url ?? definitions[node.identifier?.toUpperCase()];
    // @ts-expect-error - ok
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
        parentSet1.add(node.type);
        return processInlineNodeChildren(node, parentSet1);
      case "link":
      case "linkReference":
        parentSet1.add("link");
        return [
          url.startsWith("#")
            ? new InternalHyperlink({
                anchor: url,
                children: await processInlineNodeChildren(node, parentSet1),
              })
            : new ExternalHyperlink({
                link: url,
                children: await processInlineNodeChildren(node, parentSet1),
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
      default:
        return [new TextRun("")];
    }
  };

  const processInlineNodeChildren = async (
    node: RootContent,
    parentSet: Set<InlineParentType> = new Set(),
    // @ts-expect-error --> TS is not able to properly type
  ) => (await Promise.all(node.children.map(child => processInlineNode(child, parentSet)))).flat();

  return processInlineNodeChildren;
};

type MutableParaOptions = {
  -readonly [K in keyof IParagraphOptions]: IParagraphOptions[K];
};

export const toSection = async (node: Root, props?: ISectionProps) => {
  const { imageResolver, useTitle, ...sectionProps } = { ...defaultProps, ...props };
  const { definitions, footnoteDefinitions } = getDefinitions(node.children);

  const processInlineNodeChildren = createInlineProcessor(definitions, imageResolver!);

  const processBlockNode = async (node: RootContent, parents: BlockParentType[]) => {
    const parents1 = [...parents];
    // todo - tmp will improve
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
            // @ts-expect-error --> TS is not able to properly type
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
        parents1.push(node.type);
        return processBlockNodeChildren(node, parents1);
      case "thematicBreak":
        return [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6 } } })];
      case "table":
      case "tableRow":
      case "tableCell":
      case "footnoteReference":
      case "yaml":
      case "html":
      default:
        console.warn(`Unsupported node type: ${node.type}`, node);
        return [];
    }
  };

  const processBlockNodeChildren = async (
    node: Root | RootContent,
    parents: BlockParentType[] = [],
  ) =>
    // @ts-expect-error --> TS is not able to properly type
    (await Promise.all(node.children?.map(child => processBlockNode(child, parents)))).flat();

  return { ...sectionProps, children: await processBlockNodeChildren(node) };
};
