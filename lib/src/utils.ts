import { IImageOptions } from "@mayank1513/docx";
import { BlockContent, DefinitionContent, Root, RootContent } from "mdast";
export { convertInchesToTwip, convertMillimetersToTwip } from "@mayank1513/docx";

/**
 * get definitions
 */
export const getDefinitions = (nodes: RootContent[]) => {
  const definitions: Record<string, string> = {};
  const footnoteDefinitions: Record<string, (BlockContent | DefinitionContent)[]> = {};
  nodes.forEach(node => {
    if (node.type === "definition") {
      definitions[node.identifier.toUpperCase()] = node.url;
    } else if (node.type === "footnoteDefinition") {
      footnoteDefinitions[node.identifier.toUpperCase()] = node.children;
      // @ts-expect-error - we are checking only for nodes that have children
    } else if (node.children?.length) {
      // @ts-expect-error - we using only the nodes that have children
      Object.assign(definitions, getDefinitions(node.children));
    }
  });
  return { definitions, footnoteDefinitions };
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

export function getImageMimeType(buffer: Buffer | ArrayBuffer) {
  const signatureLength = 4;
  const signatureArray = new Uint8Array(buffer).slice(0, signatureLength);

  if (signatureArray[0] === 66 && signatureArray[1] === 77) return "bmp";

  let signature = "";

  signatureArray.forEach(byte => {
    signature += byte.toString(16).padStart(2, "0");
  });

  switch (signature) {
    case "89504E47":
      return "png";
    case "47494638":
      return "gif";
    case "FFD8FFE0": // or other FFD8FF... signatures
    case "FFD8FFE1":
    case "FFD8FFE2":
    case "FFD8FFE3":
    case "FFD8FFE8":
      return "jpg";
  }
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
      data: canvas.toDataURL("image/png"),
      type: "png",
      transformation: {
        width: width / DATA_IMG_SCALE,
        height: height / DATA_IMG_SCALE,
      },
    };
  } else throw new Error("Canvas context not available");
};

const handleNonDataUrls = async (url: string): Promise<IImageOptions> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = getImageMimeType(arrayBuffer) || "png";
  const imageBitmap = await createImageBitmap(new Blob([arrayBuffer], { type: mimeType }));

  return {
    type: mimeType,
    data: arrayBuffer,
    transformation: {
      width: imageBitmap.width,
      height: imageBitmap.height,
    },
  };
};

const imageResolver: ImageResolver = async (src: string) => {
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
};

export const defaultProps: IMdastToDocxSectionProps = {
  useTitle: true,
  imageResolver,
};
