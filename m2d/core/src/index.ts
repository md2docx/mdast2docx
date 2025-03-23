import { Document, OutputType, Packer, Paragraph } from "docx";
import type { Root } from "mdast";

import { toSection } from "./section";
import { defaultDocxProps, getDefinitions, type IDocxProps, type ISectionProps } from "./utils";

/**
 * Represents the input Markdown AST tree(s) for conversion.
 * Supports either:
 * - A single `Root` node (direct conversion)
 * - An array of objects `{ ast: Root, props?: ISectionProps }` for fine-grained section-level control.
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
  docxProps: IDocxProps = {},
  defaultSectionProps: ISectionProps = {},
  outputType: OutputType = "blob",
) => {
  let currentFootnoteId = 1;
  // Stores footnotes indexed by their unique ID
  const footnotes: Record<number, { children: Paragraph[] }> = {};

  const finalDocxProps = { ...defaultDocxProps, ...docxProps };
  // Apply global document-level modifications from default plugins
  defaultSectionProps?.plugins?.forEach(plugin => plugin.root?.(finalDocxProps));

  const processedAstInputs = await Promise.all(
    (Array.isArray(astInputs) ? astInputs : [{ ast: astInputs }]).map(async ({ ast, props }) => {
      const { definitions, footnoteDefinitions } = getDefinitions(ast.children);

      // Convert footnotes into sections
      await Promise.all(
        Object.values(footnoteDefinitions).map(async footnote => {
          footnote.id = currentFootnoteId;
          footnotes[currentFootnoteId] = (await toSection(
            { type: "root", children: footnote.children },
            definitions,
            {},
          )) as { children: Paragraph[] };
          currentFootnoteId++;
        }),
      );

      // update docxProps by plugins
      props?.plugins?.forEach(plugin => plugin.root?.(finalDocxProps));

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
    ...finalDocxProps,
    footnotes,
    sections,
  });

  return Packer.pack(doc, outputType);
};

export type { ISectionProps, IDocxProps, IInputMDAST };
export type { IPlugin, Mutable, Optional } from "./utils";
export type * from "@m2d/mdast";
