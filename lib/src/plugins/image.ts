import type { IImageOptions } from "@mayank1513/docx";
import { IPlugin } from "../utils";

/**
 * Resolves an image source URL into the appropriate image options for DOCX conversion.
 */
export type ImageResolver = (src: string, options?: IImagePluginOptions) => Promise<IImageOptions>;

/**
 * Determines the MIME type of an image based on its binary signature.
 *
 * @param buffer - The image buffer (ArrayBuffer or Buffer).
 * @returns The detected MIME type as a string.
 */
export const getImageMimeType = (buffer: Buffer | ArrayBuffer) => {
  const signatureArray = new Uint8Array(buffer).slice(0, 4);

  if (signatureArray[0] === 66 && signatureArray[1] === 77) return "bmp";

  const signature = signatureArray.reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, "0"),
    "",
  );

  switch (signature) {
    case "89504E47":
      return "png";
    case "47494638":
      return "gif";
    case "FFD8FFE0": // JPEG signatures
    case "FFD8FFE1":
    case "FFD8FFE2":
    case "FFD8FFE3":
    case "FFD8FFE8":
      return "jpg";
  }
};

/** Default scale factor for base64-encoded images */
const DEFAULT_SCALE_FACTOR = 3;

/**
 * Processes base64-encoded images, extracts dimensions, and returns image options.
 *
 * @param src - Base64 image source.
 * @param scaleFactor - Scaling factor for resolution adjustment.
 * @returns Image options with transformation details.
 */
const handleDataUrls = async (src: string, scaleFactor: number): Promise<IImageOptions> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  const img = new Image();
  img.src = src;
  await new Promise(resolve => (img.onload = resolve));

  const width = img.width * scaleFactor;
  const height = img.height * scaleFactor;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  const imgData: IImageOptions = {
    data: canvas.toDataURL("image/png"),
    type: "png",
    transformation: {
      width: width / scaleFactor,
      height: height / scaleFactor,
    },
  };

  return src.includes("svg")
    ? {
        ...imgData,
        type: "svg",
        data: src,
        fallback: {
          type: "png",
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
const handleNonDataUrls = async (url: string): Promise<IImageOptions> => {
  const response = await fetch(url);

  if (/(svg|xml)/.test(response.headers.get("content-type") ?? "")) {
    const svgText = await response.text();
    return handleDataUrls(`data:image/svg+xml;base64,${btoa(svgText)}`, DEFAULT_SCALE_FACTOR);
  }
  console.log("----", response);
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

/**
 * Resolves an image source (base64 or external URL) into image options for DOCX conversion.
 *
 * @param src - Image source URL.
 * @param options - Plugin options including scaling factor.
 * @returns The resolved image options.
 */
const imageResolver: ImageResolver = async (src: string, options?: IImagePluginOptions) => {
  try {
    return src.startsWith("data:")
      ? await handleDataUrls(src, options?.scale ?? DEFAULT_SCALE_FACTOR)
      : await handleNonDataUrls(src);
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
 * Options for the image plugin.
 */
interface IImagePluginOptions {
  /**
   * Scaling factor for base64-encoded images.
   * @default 3
   */
  scale?: number;
}

/**
 * Image plugin for processing inline image nodes in Markdown AST.
 * This plugin is designed for client-side (web) environments.
 */
export const imagePlugin: (options?: IImagePluginOptions) => IPlugin = options => ({
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
          ...(await imageResolver(url, options)),
          altText: { description: alt, name: alt, title: alt },
        }),
      ];
    }
    return [];
  },
});
