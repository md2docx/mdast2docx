import { AlignmentType, convertInchesToTwip, ILevelsOptions, LevelFormat } from "docx";
import type { IPlugin, Optional } from "@m2d/core";

/**
 * Default options for the list plugin.
 */
interface IDefaultListPluginOptions {
  /** Defines the numbering styles for ordered lists. */
  levels: ILevelsOptions[];
  /** Defines the numbering styles for bullet lists (optional). */
  bulletLevels?: ILevelsOptions[];
  /**
   * Bullet characters used for unordered lists.
   * These closely match the default bullets in Microsoft Word.
   */
  bullets: string[];
  /** If true, uses Word's default bullet styles instead of custom ones. */
  defaultBullets: boolean;
}

/** Type representing optional list plugin options. */
export type IListPluginOptions = Optional<IDefaultListPluginOptions>;

const levelFormats: (typeof LevelFormat)[keyof typeof LevelFormat][] = [
  LevelFormat.DECIMAL,
  LevelFormat.DECIMAL,
  LevelFormat.DECIMAL,
  LevelFormat.DECIMAL,
  LevelFormat.UPPER_LETTER,
  LevelFormat.LOWER_LETTER,
  LevelFormat.LOWER_ROMAN,
  LevelFormat.UPPER_ROMAN,
];

/**
 * Generates a list of numbering levels for ordered lists.
 *
 * @param levelFormats - An array of level formats defining the numbering style at each level.
 * @param indent - The starting indentation in inches for the first level.
 * @param indentStep - The incremental indentation added for each subsequent level.
 * @returns An array of `ILevelsOptions` defining the hierarchical numbering style.
 *
 * Example:
 * - Level 1: "1."
 * - Level 2: "1.1."
 * - Level 3: "1.1.1."
 * - Level 4: "A."
 * - Level 5: "a."
 */
export const createLevels = (
  levelFormats: (typeof LevelFormat)[keyof typeof LevelFormat][],
  indent = 0.4, // Base indentation for the first level (in inches)
  indentStep = 0.25, // Additional indentation per level
) =>
  levelFormats.map((format, i) => ({
    level: i,
    format,
    text:
      (format === LevelFormat.DECIMAL
        ? Array(i + 1)
            .fill(`%${i + 1}`)
            .join(".") // Generates hierarchical decimal numbering (e.g., "1.1.1")
        : `%${i + 1}`) + ".",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { left: convertInchesToTwip(indent + i * indentStep) }, // Ensures consistent indentation
      },
    },
  }));

/** Default numbering levels for ordered lists (1., 1.1, A) */
const levels = createLevels(levelFormats);

/** Commonly used bullet characters in Word */
const bullets = ["●", "○", "■", "◆", "▶", "◉", "⬤", "♦", "◦", "▪"];

/** Default plugin options */
const defaultListPluginOptions: IDefaultListPluginOptions = {
  levels,
  bullets,
  defaultBullets: false,
};

/**
 * A plugin that enables support for ordered and unordered lists in DOCX.
 *
 * @param options - Optional configuration for customizing lists.
 * @returns An `IPlugin` instance for handling lists in the document.
 */
export const listPlugin: (options?: IListPluginOptions) => IPlugin = options => {
  const uId = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  const numReference = `numbering-${uId}`;
  const bulletReference = `bullet-${uId}`;
  const { levels, bulletLevels, bullets, defaultBullets } = {
    ...defaultListPluginOptions,
    ...options,
  };

  return {
    /**
     * Processes block-level list nodes.
     *
     * @param docx - The docx instance.
     * @param node - The list node from the MDAST tree.
     * @param paraProps - Paragraph properties to apply.
     * @param blockChildrenProcessor - Function to process child list items.
     * @returns Processed paragraphs representing the list.
     */
    block: async (_docx, node, paraProps, blockChildrenProcessor) => {
      if (node.type !== "list") return [];

      const level = (paraProps.bullet?.level ?? -1) + 1;

      paraProps.numbering = defaultBullets
        ? undefined
        : {
            level,
            reference: node.ordered ? numReference : bulletReference,
          };

      paraProps.bullet = { level };

      // @ts-expect-error -- setting type to empty string to avoid recomputation
      node.type = "";
      return await blockChildrenProcessor(node, paraProps);
    },

    /**
     * Configures document-level numbering and bullet styles.
     *
     * @param props - The document properties object.
     */
    root: props => {
      props.numbering = {
        config: [
          ...(props.numbering?.config ?? []),
          {
            reference: numReference,
            levels,
          },
          {
            reference: bulletReference,
            levels:
              bulletLevels ??
              levels.map((level, i) => ({
                ...level,
                text: bullets[i] ?? "•",
                format: LevelFormat.BULLET,
              })),
          },
        ],
      };
    },
  };
};
