import { Root, RootContent } from "mdast";
import { defaultProps, getDefinitions, ImageResolver, IMdastToDocxSectionProps } from "./utils";
import { ISectionOptions, Paragraph, TextRun } from "@mayank1513/docx";

export type ISectionProps = Omit<ISectionOptions, "children"> & IMdastToDocxSectionProps;

const createInlineProcessor =
  (definitions: Record<string, string>, imageResolver: ImageResolver) =>
  async (node: RootContent) => {
    switch (node.type) {
      case "text":
      case "break":
      case "inlineCode":
      case "emphasis":
      case "strong":
      case "delete":
      case "link":
      case "image":
      case "linkReference":
      case "imageReference":
        return [new TextRun({ text: node.value })];
      default:
        return [new TextRun("")];
    }
  };

const promiseAll = async <T>(
  node: Root | RootContent,
  processor: (node: RootContent) => Promise<T[]>,
  // @ts-expect-error --> TS is not able to properly type
) => (await Promise.all(node.children?.map(processor))).flat();

export const toSection = async (node: Root, props?: ISectionProps) => {
  const { imageResolver, useTitle, ...sectionProps } = { ...defaultProps, ...props };
  const definitions = getDefinitions(node.children);

  const processInlineNode = createInlineProcessor(definitions, imageResolver!);

  const processAllInlineNodes = (node: RootContent) => promiseAll(node, processInlineNode);

  const processBlockNode = async (node: RootContent) => {
    const docxNodes = [];
    switch (node.type) {
      case "paragraph":
        docxNodes.push(new Paragraph({ children: await processAllInlineNodes(node) }));
        break;
      case "heading":
        // Handle heading node
        new Paragraph({
          // @ts-expect-error --> TS is not able to properly type
          heading: useTitle
            ? node.depth === 1
              ? "Title"
              : `Heading${node.depth - 1}`
            : `Heading${node.depth}`,
          children: await processAllInlineNodes(node),
        });
    }
    return docxNodes;
  };

  const processAllBlockNodes = (node: Root | RootContent) => promiseAll(node, processBlockNode);
  return { ...sectionProps, children: await processAllBlockNodes(node) };
};
