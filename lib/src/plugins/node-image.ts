/**
 * This plugin is not working at the moment because of issues in installing sharp or canvas
 */

import { IImageOptions } from "@mayank1513/docx";
import { IPlugin } from "../utils";
import sharp from "sharp";
import fetch from "node-fetch";

export const SUPPORTED_IMAGE_TYPES = ["jpg", "gif", "png"] as const;
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

interface INodeImagePluginOptions {
  /**
   * pathPrefix
   */
  pathPrefix?: string;
  /**
   * Fallback image type if the image type cannot be determined or is not supported.
   * @default "png"
   */
  fallbackImageType?: "png" | "jpg" | "gif";
}

/**
 * Resolves an image source URL into the appropriate image options for DOCX conversion.
 */
export type NodeImageResolver = (
  src: string,
  options?: INodeImagePluginOptions,
) => Promise<IImageOptions>;

/**
 * Processes base64-encoded images, extracts dimensions, and returns image options.
 *
 * @param src - Base64 image source.
 * @param scaleFactor - Scaling factor for resolution adjustment.
 * @returns Image options with transformation details.
 */
const handleDataUrls: NodeImageResolver = async (
  src: string,
  options?: INodeImagePluginOptions,
) => {
  const sharpImg = sharp(src);
  const metadata = await sharpImg.metadata();
  const width = metadata.width ?? 100;
  const height = metadata.height ?? 100;
  const imgType = src.split(";")[0].split("/")[1];
  // @ts-expect-error -- ok
  if (SUPPORTED_IMAGE_TYPES.includes(imgType)) {
    return {
      type: imgType as SupportedImageType,
      data: src,
      transformation: {
        width,
        height,
      },
    };
  }
  const fallbackImageType = options?.fallbackImageType ?? "png";

  const imgData: IImageOptions = {
    data: await sharpImg.toFormat(fallbackImageType).toBuffer(),
    type: fallbackImageType,
    transformation: {
      width: width,
      height: height,
    },
  };

  return src.includes("svg")
    ? {
        ...imgData,
        type: "svg",
        data: src,
        fallback: {
          type: fallbackImageType,
          data: imgData.data,
        },
      }
    : imgData;
};

/**
 * Fetches an image from an external URL, determines its type, and extracts dimensions.
 *
 * @param url - Image URL.
 * @returns Image options with metadata.
 */
const handleNonDataUrls: NodeImageResolver = async (
  src: string,
  options?: INodeImagePluginOptions,
) => {
  let sharpImg, width, height;
  if (src.startsWith("http")) {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "image/png";
    const imgType = mimeType.split("/")[1];
    sharpImg = sharp(arrayBuffer);
    const metadata = await sharpImg.metadata();
    width = metadata.width ?? 100;
    height = metadata.height ?? 100;
    // skipcq: JS-0323
    if (SUPPORTED_IMAGE_TYPES.includes(imgType as any)) {
      return {
        type: imgType as SupportedImageType,
        data: arrayBuffer,
        transformation: {
          width,
          height,
        },
      };
    }
  } else {
    const pathPrefix = options?.pathPrefix ?? "";
    sharpImg = sharp(pathPrefix + src);
    const metadata = await sharpImg.metadata();
    width = metadata.width ?? 100;
    height = metadata.height ?? 100;
    const imgType = src.split(".").pop();
    // skipcq: JS-0323
    if (SUPPORTED_IMAGE_TYPES.includes(imgType as any)) {
      return {
        type: imgType as SupportedImageType,
        data: await sharpImg.toBuffer(),
        transformation: {
          width,
          height,
        },
      };
    }
  }
  const fallbackImageType = options?.fallbackImageType ?? "png";

  return {
    data: await sharpImg.toFormat(fallbackImageType).toBuffer(),
    type: fallbackImageType,
    transformation: {
      width,
      height,
    },
  };
};

/**
 * Resolves an image source (base64 or external URL) into image options for DOCX conversion.
 *
 * @param src - Image source URL.
 * @param options - Plugin options including scaling factor.
 * @returns The resolved image options.
 */
const nodeImageResolver: NodeImageResolver = async (
  src: string,
  options?: INodeImagePluginOptions,
) => {
  try {
    return src.startsWith("data:")
      ? await handleDataUrls(src, options)
      : await handleNonDataUrls(src, options);
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

/**
 * Image plugin for processing inline image nodes in Markdown AST.
 * This plugin is designed for server-side (node.js) environments.
 */
export const nodeImagePlugin: (options?: INodeImagePluginOptions) => IPlugin = options => ({
  inline: async (docx, node, _, definitions) => {
    if (/^image/.test(node.type)) {
      // Extract image URL from the node or definitions
      // @ts-expect-error - node might not have a URL or identifier, but those cases are handled
      const url = node.url ?? definitions[node.identifier?.toUpperCase()];
      // @ts-expect-error - node might not have alt text
      const alt = node.alt ?? url?.split("/").pop();
      node.type = "";
      return [
        new docx.ImageRun({
          ...(await nodeImageResolver(url, options)),
          altText: { description: alt, name: alt, title: alt },
        }),
      ];
    }
    return [];
  },
});
