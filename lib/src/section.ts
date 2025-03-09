import { Root, RootContent } from "mdast";
import { getDefinitions } from "./utils";
import { ISectionOptions, Paragraph, TextRun } from "@mayank1513/docx";

export type ISectionProps = Omit<ISectionOptions, "children">;

const processInlineNode = async (node: RootContent) => {
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
      return new TextRun({ text: node.value });
    default:
      return new TextRun("");
  }
};

export const toSection = async ({ children }: Root, props?: ISectionProps) => {
  const definitions = getDefinitions(children);

  const processNode = async (node: RootContent) => {
    const docxNodes = [];
    switch (node.type) {
      case "paragraph":
        docxNodes.push(
          new Paragraph({ children: await Promise.all(node.children.map(processInlineNode)) }),
        );
    }
    return docxNodes;
  };
  return { ...props, children: (await Promise.all(children.map(processNode))).flat() };
};
