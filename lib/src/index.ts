import { Document, OutputType, Packer, Paragraph, type IPropertiesOptions } from "@mayank1513/docx";
import type { Root } from "mdast";

import { toSection, type ISectionProps } from "./section";
import { getDefinitions } from "./utils";

/**
 * Defines document properties, excluding sections and footnotes (which are managed internally).
 */
type IDocxProps = Omit<IPropertiesOptions, "sections" | "footnotes">;

/**
 * Represents the input MDAST tree(s) for conversion.
 * It can be a single root node or an array of objects containing the AST and optional section properties.
 */
type IInputMDAST = Root | { ast: Root; props?: ISectionProps }[];

/**
 * Converts an MDAST (Markdown Abstract Syntax Tree) into a DOCX document.
 * @param astInputs - A single or multiple MDAST trees with optional section properties.
 * @param docxProps - General document properties. @see https://docx.js.org/#/usage/document
 * @param defaultSectionProps - Default properties for each document section. @see https://docx.js.org/#/usage/sections
 * @param outputType - The desired output format (default: `"blob"`). @see https://docx.js.org/#/usage/packers
 * @returns A DOCX document in the specified format.
 */
export const toDocx = async (
  astInputs: IInputMDAST,
  docxProps: IDocxProps,
  defaultSectionProps: ISectionProps,
  outputType: OutputType = "blob",
) => {
  let currentFootnoteId = 1;
  const footnotes: Record<number, { children: Paragraph[] }> = {};

  const processedAstInputs = await Promise.all(
    (Array.isArray(astInputs) ? astInputs : [{ ast: astInputs }]).map(async ({ ast, props }) => {
      const { definitions, footnoteDefinitions } = getDefinitions(ast.children);

      // Convert footnotes into sections
      await Promise.all(
        Object.entries(footnoteDefinitions).map(async ([, footnote]) => {
          footnote.id = currentFootnoteId;
          footnotes[currentFootnoteId] = (await toSection(
            { type: "root", children: footnote.children },
            definitions,
            {},
          )) as { children: Paragraph[] };
          currentFootnoteId++;
        }),
      );

      return { ast, props: { ...defaultSectionProps, ...props }, definitions, footnoteDefinitions };
    }),
  );

  // Convert MDAST trees into document sections
  const sections = await Promise.all(
    processedAstInputs.map(({ ast, props, definitions, footnoteDefinitions }) =>
      toSection(ast, definitions, footnoteDefinitions, props),
    ),
  );

  // Create DOCX document
  const doc = new Document({
    ...docxProps,
    footnotes,
    sections,
  });

  return Packer.pack(doc, outputType);
};

export type { ISectionProps, IDocxProps, IInputMDAST };
