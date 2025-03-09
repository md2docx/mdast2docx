import { IImageOptions } from "@mayank1513/docx";
import { Root, RootContent } from "mdast";

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

/**
 * process all nodes async and return the result
 */
export const promiseAll = async <T>(
  node: Root | RootContent,
  processor: (node: RootContent) => Promise<T[]>,
  // @ts-expect-error --> TS is not able to properly type
) => (await Promise.all(node.children?.map(processor) ?? [])).flat();

export type ImageResolver = (src: string) => Promise<IImageOptions>;

export interface IMdastToDocxSectionProps {
  /**
   * If true, h1 will corresposnd to title, h2 to Heading1, etc.
   * @default true
   */
  useTitle?: boolean;
  /**
   * Cutom image resolver. By default we assume client side code
   */
  imageResolver?: ImageResolver;
}

const DATA_IMG_SCALE = 3;

const handleDataUrls = async (src: string): Promise<IImageOptions> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = new Image();
    img.src = src;
    await new Promise(resolve => {
      img.onload = resolve;
    });
    const width = img.width * DATA_IMG_SCALE;
    const height = img.height * DATA_IMG_SCALE;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return {
      type: "png",
      data: Buffer.from(
        ctx.getImageData(0, 0, width / DATA_IMG_SCALE, height / DATA_IMG_SCALE).data.buffer,
      ),
      transformation: {
        width,
        height,
      },
    };
  } else throw new Error("Canvas context not available");
};

const handleNonDataUrls = async (url: string): Promise<IImageOptions> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const imageBitmap = await createImageBitmap(new Blob([buffer], { type: "image/*" }));

  return {
    type: "png",
    data: buffer,
    transformation: {
      width: imageBitmap.width,
      height: imageBitmap.height,
    },
  };
};

export const defaultProps: IMdastToDocxSectionProps = {
  useTitle: true,
  imageResolver: async (src: string) => {
    try {
      if (src.startsWith("data:")) return await handleDataUrls(src);
      return await handleNonDataUrls(src);
    } catch (error) {
      console.error(`Error resolving image: ${src}`, error);
      return {
        type: "png",
        data: Buffer.from([]),
        transformation: {
          width: 100,
          height: 100,
        },
      };
    }
  },
};
