import {
  inlineMdastNodes,
  IPlugin,
  Mutable,
  standardize_color as standardizeColor,
} from "../utils";
import { toMdast } from "hast-util-to-mdast";
import { fromHtml } from "hast-util-from-html";
import { Root, RootContent } from "mdast";
import { IRunOptions } from "docx";

/**
 * @beta
 * htmlPlugin is in beta and is subject to change or removal without notice.
 * This plugin is a placeholder for future implementation of HTML conversion.
 *
 * Keep this before image plugin to ensure inline html images are processed.
 */
export const htmlPlugin: () => IPlugin = () => {
  const inlineTagStack: Mutable<Omit<IRunOptions, "children">>[] = [];
  return {
    block: async (_docx, node) => {
      if (node.type === "html") {
        const newNode = toMdast(fromHtml(node.value, { fragment: true })) as Root;
        Object.assign(node, newNode);
        if (inlineMdastNodes.includes(newNode?.children[0]?.type))
          (node as RootContent).type = "paragraph";
      }
      return [];
    },
    inline: async (docx, node, runProps) => {
      if (node.type === "html") {
        const value = node.value?.trim() ?? "";
        console.log("inline html", node);
        const newRunProps: typeof runProps = {};
        const tag = value.split(" ")[0].slice(1);
        if (tag.startsWith("/")) {
          const last = inlineTagStack.pop();
          if (last)
            Object.keys(runProps).forEach(key => {
              // @ts-expect-error - runProps[key] is not guaranteed to exist on last
              if (last[key] === undefined) delete runProps[key];
              Object.assign(runProps, last);
            });
        } else if (!value.endsWith("/>")) {
          inlineTagStack.push({ ...runProps });
        }
        value
          .match(/style *= *".*?"/)?.[0]
          .split('"')[1]
          .split(";")
          .filter(Boolean)
          .forEach(pair => {
            const [key, value] = pair.split(":");
            switch (key.trim().toLowerCase()) {
              case "font-weight":
                if (value.trim() === "bold") {
                  newRunProps.bold = true;
                }
                break;
              case "font-style":
                if (value.trim() === "italic") {
                  newRunProps.italics = true;
                }
                break;
              case "text-decoration":
                if (value.trim() === "underline") {
                  newRunProps.underline = {};
                }
                break;
              case "color":
                newRunProps.color = standardizeColor(value.trim());
                break;
              // case "font-size":
              //   runProps.size = parseInt(value.trim().replace("px", ""));
              //   break;
              case "font-family":
                newRunProps.font = value.trim();
                break;
              case "text-transform":
                if (value.trim() === "uppercase") {
                  newRunProps.allCaps = true;
                }
                break;
              case "border":
                newRunProps.border = { style: docx.BorderStyle.SINGLE, size: 6 };
                break;
              case "vertical-align":
                if (value.trim() === "sub") {
                  newRunProps.subScript = true;
                } else if (value.trim() === "super") {
                  newRunProps.superScript = true;
                }
                break;
              default:
                console.warn(`Unsupported style: ${key.trim()}->${value.trim()}`);
            }
          });
        Object.assign(runProps, newRunProps);
        if (tag === "img") {
          const img = node.value.match(/src *= *".*?"/)?.[0].split('"')[1];
          Object.assign(node, { type: "image", url: img });
        } else if (tag === "a") {
          Object.assign(node, {
            type: "link",
            url: node.value.match(/href *= *".*?"/)?.[0].split('"')[1] ?? "",
          });
        } else if (value.endsWith("</a>")) {
        } else {
          // @ts-expect-error -- ok
          node.type = "";
        }
      }
      return [];
    },
  };
};
