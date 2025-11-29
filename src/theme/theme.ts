'use client'
import ComponentsOverrides from '@/theme/overrides/index'
import { createTheme, shouldSkipGeneratingVar } from '@mui/material'
import breakpoints from './breakpoints'
import { customShadows, typography } from './core'
import { COMMON, GREY } from './core/palette'

//#858a8fff
const initialTheme = {
  colorSchemes: {
    light: {
      palette: {
        ...COMMON,
        text: {
          //primary: { primary: GREY[900], contrastText: "#fff" },
          primary: GREY[900],
          //secondary: GREY[700],
          secondary: '#858a8fff',
          disabled: GREY[500],
          menu: '#858a8fff',
          contrastText: '#858a8fff',
        },
        warning: {
          lighter: '#FFF3BF',
          light: '#FFD33D',
          main: '#f1ba23ff', // Amarelo suave do GitHub
          dark: '#B08800',
          darker: '#735C00',
          contrastText: GREY[800],
        },
        background: { paper: GREY[0], default: '#EBEBEB', active: '#DFE1EA' },
        action: { active: GREY[600], ...COMMON.action },
      },
    },
    dark: {
      palette: {
        ...COMMON,
        success: {
          lighter: '#0F3E1E',
          light: '#196127',
          main: '#D6FBE9', // Verde característico do GitHub
          dark: '#196127',
          darker: '#0F3E1E',
          contrastText: GREY[100],
        },
        text: {
          primary: '#858a8fff',
          secondary: GREY[0],
          disabled: GREY[600],
          menu: '#858a8fff',
          contrastText: GREY[900],
        },
        background: {
          paper: GREY[900],
          default: GREY[1000],
          active: '#DFE1EA',
        },
        action: { active: GREY[500], ...COMMON.action },
      },
    },
  },
  mixins: {
    toolbar: {
      minHeight: 64, // altura padrão mobile
      paddingLeft: '16px',
      paddingRight: '16px',
      '@media (min-width:600px)': {
        minHeight: 72, // altura em desktop
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: 'class' as const,
  },
  //   palette: {
  //     ...COMMON,
  //     text: { primary: GREY[900], secondary: GREY[700], disabled: GREY[500] },
  //     background: { paper: GREY[0], default: "#F0F6FC" },
  //     action: { active: GREY[600], ...COMMON.action },
  //   },
  //shadows: customShadows.light,
  shape: { borderRadius: 8 },
  // components,
  typography,
  breakpoints,
  //cssVarPrefix: "",
  customShadows: {
    ...customShadows.light,
    // ...customShadows.dark,
    // primary: `0 8px 16px 0 ${alpha(palette.light.primary.main, 0.24)}`,
  },
  shouldSkipGeneratingVar,
}

const theme = createTheme(initialTheme)
theme.components = ComponentsOverrides(theme) as typeof theme.components

export default theme
