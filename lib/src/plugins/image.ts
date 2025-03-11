import type { IImageOptions } from "@mayank1513/docx";
import { IPlugin } from "../utils";

/**
 * Type definition for an image resolver function.
 */
export type ImageResolver = (src: string) => Promise<IImageOptions>;

/**
 * Determines the MIME type of an image from its binary buffer.
 * @param buffer - The image buffer (ArrayBuffer or Buffer).
 * @returns The detected MIME type as a string.
 */
export const getImageMimeType = (buffer: Buffer | ArrayBuffer) => {
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
};

/** Scale factor for data images */
const DATA_IMG_SCALE = 3;

/**
 * Handles base64-encoded image URLs and converts them into image options.
 * @param src - The base64 image source.
 * @returns The image options with transformation details.
 */
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

/**
 * Fetches an image from a URL and extracts its options.
 * @param url - The image URL.
 * @returns The extracted image options.
 */
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

/**
 * Resolves an image URL (base64 or external) to the required format.
 * @param src - The image source URL.
 * @returns The resolved image options.
 */
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

export const imagePlugin: IPlugin = {
  inline: async (docx, node, _, definitions) => {
    if (/^image/.test(node.type)) {
      // @ts-expect-error - node might not have url or identifier, but we are already handling those cases.
      const url = node.url ?? definitions[node.identifier?.toUpperCase()];
      // @ts-expect-error - node might not have alt
      const alt = node.alt ?? url?.split("/").pop();
      node.type = "";
      return [
        new docx.ImageRun({
          ...(await imageResolver(url)),
          altText: { description: alt, name: alt, title: alt },
        }),
      ];
    }
    return [];
  },
};
