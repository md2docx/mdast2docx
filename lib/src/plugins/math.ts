import { IPlugin } from "../utils";

export const mathPlugin: () => IPlugin<{
  type: "" | "math" | "inlineMath";
  value?: string;
}> = () => {
  return {
    inline: async (docx, node, parentSet, definitions, footnoteDefinitions) => {
      if (node.type !== "inlineMath") return [];
      console.log("inline math", node.value);
      return [new docx.MathRun(node.value ?? "")];
    },
    block: async (docx, node, paraProps, blockChildrenProcessor) => {
      if (node.type !== "math") return [];
      return [
        new docx.Paragraph({
          ...paraProps,
          children: [new docx.MathRun(node.value ?? "")],
        }),
      ];
    },
  };
};
