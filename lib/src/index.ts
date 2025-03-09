import { Document, OutputType, Packer, Paragraph, type IPropertiesOptions } from "@mayank1513/docx";
import type { Root } from "mdast";

import { toSection, type ISectionProps } from "./section";
import { Definitions, FootnoteDefinitions, getDefinitions } from "./utils";
type IDocxProps = Omit<IPropertiesOptions, "sections">;
type IInputMDAST = Root | { ast: Root; props?: ISectionProps }[];

export const toDocx = async (
  astInputs: IInputMDAST,
  docxProps: IDocxProps,
  defaultSectionProps: ISectionProps,
  outputType: OutputType = "blob",
) => {
  let currentFootnoteId = 1;
  const footnotes: Record<number, { children: Paragraph }> = {};
  const astInputs1: {
    ast: Root;
    props?: ISectionProps;
    definitions: Definitions;
    footnoteDefinitions: FootnoteDefinitions;
  }[] = await Promise.all(
    (Array.isArray(astInputs) ? astInputs : [{ ast: astInputs }]).map(async ({ ast, props }) => {
      const { definitions, footnoteDefinitions } = getDefinitions(ast.children);
      await Promise.all(
        Object.keys(footnoteDefinitions).map(async key => {
          const children = footnoteDefinitions[key].children;
          footnotes[currentFootnoteId] = await toSection(
            { type: "root", children },
            definitions,
            {},
          );
          footnoteDefinitions[key].id = currentFootnoteId++;
        }),
      );
      return { ast, props: { ...defaultSectionProps, ...props }, definitions, footnoteDefinitions };
    }),
  );

  const sections = await Promise.all(
    astInputs1.map(({ ast, props, definitions, footnoteDefinitions }) =>
      toSection(ast, definitions, footnoteDefinitions, props),
    ),
  );

  const doc = new Document({
    ...docxProps,
    // @ts-expect-error -- we deliberately keep it non readonly as we are editing on the go
    footnotes,
    sections,
  });

  return Packer.pack(doc, outputType);
};

export type { ISectionProps, IDocxProps, IInputMDAST };
