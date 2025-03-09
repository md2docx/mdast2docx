import { RootContent } from "mdast";

/**
 * get definitions
 */
export const getDefinitions = (nodes: RootContent[]) => {
  const definitions: Record<string, string> = {};
  nodes.forEach(node => {
    if (node.type === "definition") {
      definitions[node.identifier.toUpperCase()] = node.url;
      // @ts-expect-error - we are checking only for nodes that have children
    } else if (node.children?.length) {
      // @ts-expect-error - we using only the nodes that have children
      Object.assign(definitions, getDefinitions(node.children));
    }
  });
  return definitions;
};
