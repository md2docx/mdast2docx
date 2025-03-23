import type { Plugin } from "unified";
import type { Root } from "mdast";
import { OutputType } from "docx";
import { IDocxProps, ISectionProps, toDocx } from "mdast2docx";
import {
  htmlPlugin,
  imagePlugin,
  tablePlugin,
  listPlugin,
  mathPlugin,
} from "mdast2docx/dist/plugins";

/**
 * Default mdast2docx plugins used when none are provided in `sectionProps`.
 * For server-side (Node.js), excludes the `htmlPlugin` and `imagePlugin` to avoid DOM usage.
 */
const defaultPlugins = [htmlPlugin(), tablePlugin(), listPlugin(), mathPlugin(), imagePlugin()];

/**
 * A unified compiler plugin to convert MDAST to DOCX output using `mdast2docx`.
 *
 * @param outputType - The output type for DOCX generation (e.g. "blob", "buffer", "base64").
 *                     Defaults to `"blob"`.
 * @param docxProps - Global DOCX document properties passed to `toDocx`. Optional.
 * @param sectionProps - Section-level props including plugin overrides. Optional.
 * @returns A unified plugin that injects a DOCX compiler.
 */
export const remarkDocx: Plugin<
  [outputType?: OutputType, docxProps?: IDocxProps, sectionProps?: ISectionProps],
  Root
> = function remarkDocxPlugin(outputType = "blob", docxProps = {}, sectionProps = {}) {
  // @ts-expect-error -- compiler type does not support Promise
  this.compiler = function (node) {
    // If plugins are not defined in sectionProps, use the default set
    if (!sectionProps.plugins) {
      sectionProps.plugins =
        typeof window === "undefined"
          ? defaultPlugins.slice(1, -1) // server-side: skip html & image plugins
          : defaultPlugins;
    }

    return toDocx(node as Root, docxProps, sectionProps, outputType) as Promise<OutputType>;
  };
  return node => node;
};
