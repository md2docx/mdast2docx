import { Document, OutputType, Packer, type IPropertiesOptions } from "@mayank1513/docx";
import type { Root } from "mdast";

import { toSection, type ISectionProps } from "./section";
type IDocxProps = Omit<IPropertiesOptions, "sections">;
type IInputMDAST = Root | { ast: Root; props?: ISectionProps }[];

export const toDocx = async (
  astInputs: IInputMDAST,
  docxProps: IDocxProps,
  sectionProps: ISectionProps,
  outputType: OutputType = "blob",
) => {
  const astInputs1: { ast: Root; props?: ISectionProps }[] = (
    Array.isArray(astInputs) ? astInputs : [{ ast: astInputs }]
  ).map(({ ast, props }) => ({ ast, props: { ...sectionProps, ...props } }));

  const sections = await Promise.all(astInputs1.map(({ ast, props }) => toSection(ast, props)));

  const doc = new Document({
    ...docxProps,
    sections,
  });

  return Packer.pack(doc, outputType);
};

export type { ISectionProps, IDocxProps, IInputMDAST };
