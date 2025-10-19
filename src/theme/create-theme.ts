import { alpha } from "@mui/material";
import {
  customShadows,
  typography,

  // Assume you have defined these for light and dark modes
} from "./core";
import palette from "./core/palette";
import breakpoints from "./breakpoints";

export const initialTheme = {
  palette: palette.light,
  //shadows: mode === "light" ? shadows.light : shadows.dark,
  //customShadows: mode === "light" ? customShadows.light : customShadows.dark,
  shape: { borderRadius: 8 },
  // components,
  typography,
  breakpoints,
  cssVarPrefix: "",
  customShadows: {
    ...customShadows.light,
    primary: `0 8px 16px 0 ${alpha(palette.light.primary.main, 0.24)}`,
  },
  shouldSkipGeneratingVar,
};

//export const theme = createTheme(initialTheme);

// export function Theme(): Theme {
//   return createTheme({...palette});
// }

function shouldSkipGeneratingVar(
  keys: string[]
  // value: string | number
): boolean {
  const skipGlobalKeys = [
    "mixins",
    "overlays",
    "direction",
    "typography",
    "breakpoints",
    "transitions",
    "cssVarPrefix",
    "unstable_sxConfig",
  ];

  const skipPaletteKeys: {
    [key: string]: string[];
  } = {
    global: ["tonalOffset", "dividerChannel", "contrastThreshold"],
    grey: ["A100", "A200", "A400", "A700"],
    text: ["icon"],
  };

  const isPaletteKey = keys[0] === "palette";

  if (isPaletteKey) {
    const paletteType = keys[1];
    const skipKeys = skipPaletteKeys[paletteType] || skipPaletteKeys.global;
    return keys.some((key) => skipKeys?.includes(key));
  }

  return keys.some((key) => skipGlobalKeys?.includes(key));
}
