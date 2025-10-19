export const useMix = (baseVar: string, pct: number) =>
  `color-mix(in srgb, ${baseVar} ${pct}%, transparent)`;

export const getContrastTextColor = (
  backgroundColor: string
): "#FFF" | "#21262D" => {
  const hex = backgroundColor.trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) {
    return "#21262D";
  }

  const normalizedHex =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#21262D" : "#FFF";
};
