import {
  BorderStyle,
  ShadingType,
  WidthType,
  AlignmentType,
  type ITableCellOptions,
  type ITableOptions,
  type ITableRowOptions,
  VerticalAlign,
  convertMillimetersToTwip,
} from "docx";
import { TableRow as MdTableRow, IPlugin, Optional } from "@m2d/core";

export type RowProps = Omit<ITableRowOptions, "children">;
export type TableProps = Omit<ITableOptions, "rows">;
export type CellProps = Omit<ITableCellOptions, "children">;

export interface ITableAlignments {
  defaultVerticalAlign?: (typeof VerticalAlign)[keyof typeof VerticalAlign];
  defaultHorizontalAlign?: (typeof AlignmentType)[keyof typeof AlignmentType];
  /**
   * Use MDAST data for horizontal aligning columns
   * @default true
   */
  preferMdData?: boolean;
}

interface IDefaultTablePluginProps {
  tableProps: TableProps;
  rowProps: RowProps;
  cellProps: CellProps;
  firstRowProps: RowProps;
  firstRowCellProps: CellProps;
  alignments: ITableAlignments;
}

type ITablePluginProps = Optional<IDefaultTablePluginProps>;

const border = { style: BorderStyle.SINGLE, color: "auto", size: 1 };

/**
 * default table options
 */
export const defaultTableOptions: IDefaultTablePluginProps = {
  tableProps: {
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: {
      top: convertMillimetersToTwip(2),
      right: convertMillimetersToTwip(4),
      bottom: convertMillimetersToTwip(2),
      left: convertMillimetersToTwip(4),
    },
    borders: {
      top: border,
      right: border,
      bottom: border,
      left: border,
      insideHorizontal: border,
      insideVertical: border,
    },
  },
  rowProps: {},
  cellProps: {},
  firstRowProps: { tableHeader: true },
  firstRowCellProps: { shading: { type: ShadingType.SOLID, fill: "b79c2f" } },
  alignments: {
    defaultVerticalAlign: VerticalAlign.CENTER,
    defaultHorizontalAlign: AlignmentType.CENTER,
    preferMdData: true,
  },
};

/**
 * Plugin to convert Markdown tables (MDAST) to DOCX with support for rich formatting and seamless integration into mdast2docx.
 */
export const tablePlugin: (options?: ITablePluginProps) => IPlugin = options => {
  return {
    block: async (docx, node, _paraProps, _blockChildrenProcessor, inlineChildrenProcessor) => {
      if (node.type !== "table") return [];

      const { Table, TableRow, TableCell, Paragraph } = docx;

      const { tableProps, firstRowProps, firstRowCellProps, rowProps, cellProps, alignments } = {
        ...defaultTableOptions,
        ...options,
      };

      const align = (node.align as (string | null)[] | null)?.map(a => {
        switch (a) {
          case "left":
            return docx.AlignmentType.LEFT;
          case "right":
            return docx.AlignmentType.RIGHT;
          case "center":
            return docx.AlignmentType.CENTER;
          default:
            return undefined;
        }
      });

      /**
       * Create table row
       */
      const createRow = async (row: MdTableRow, rowIndex: number) =>
        new TableRow({
          ...rowProps,
          ...(rowIndex === 0 ? firstRowProps : {}),
          children: await Promise.all(
            row.children.map(async (cell, cellIndex) => {
              return new TableCell({
                verticalAlign: alignments.defaultVerticalAlign,
                ...cellProps,
                ...(rowIndex === 0 ? firstRowCellProps : {}),
                children: [
                  new Paragraph({
                    children: await inlineChildrenProcessor(cell),
                    alignment: alignments.preferMdData
                      ? align?.[cellIndex]
                      : alignments.defaultHorizontalAlign,
                  }),
                ],
              });
            }),
          ),
        });

      const rows = await Promise.all(node.children.map(createRow));
      // @ts-expect-error - Setting type to empty string to avoid re-processing the node.
      node.type = "";
      return [new Table({ ...tableProps, rows })];
    },
  };
};
