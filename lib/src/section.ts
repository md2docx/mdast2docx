import { Root, RootContent } from "mdast";
import { defaultProps, getDefinitions, ImageResolver, IMdastToDocxSectionProps } from "./utils";
import {
  ExternalHyperlink,
  ImageRun,
  InternalHyperlink,
  ISectionOptions,
  Paragraph,
  TextRun,
} from "@mayank1513/docx";

export type ISectionProps = Omit<ISectionOptions, "children"> & IMdastToDocxSectionProps;

type InlineParentType = "strong" | "emphasis" | "delete" | "link";
type DocxTypoEmphasis = "bold" | "italics" | "strike";

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

    switch (node.type) {
      case "text":
        return [new TextRun({ text: node.value, ...decorations })];
      case "break":
        return [new TextRun({ break: 1 })];
      case "inlineCode":
        return [new TextRun({ text: node.value, ...decorations, style: "Code", math: true })];
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
        return [new ImageRun(await imageResolver(url))];
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

export const toSection = async (node: Root, props?: ISectionProps) => {
  const { imageResolver, useTitle, ...sectionProps } = { ...defaultProps, ...props };
  const definitions = getDefinitions(node.children);

  const processInlineNodeChildren = createInlineProcessor(definitions, imageResolver!);

  const processBlockNode = async (node: RootContent) => {
    switch (node.type) {
      case "paragraph":
        return [new Paragraph({ children: await processInlineNodeChildren(node) })];
      case "heading":
        // Handle heading node
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
    }
  };

  const processAllBlockNodeChildren = async (node: Root | RootContent) =>
    // @ts-expect-error --> TS is not able to properly type
    (await Promise.all(node.children?.map(processBlockNode))).flat();

  return { ...sectionProps, children: await processAllBlockNodeChildren(node) };
};
