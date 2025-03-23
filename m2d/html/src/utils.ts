export const standardizeColor = (str: string) => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return str.startsWith("#") ? str.slice(1) : "auto";
  ctx.fillStyle = str;
  return ctx.fillStyle.slice(1);
};
