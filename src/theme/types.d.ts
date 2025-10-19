export type CustomShadowOptions = {
  z1: string
  z2: string
  z8: string
  z12: string
  z16: string
  z20: string
  z24: string

  primary: string
  secondary: string
  info: string
  success: string
  warning: string
  error: string

  card: string
  dialog: string
  dropdown: string
}

declare module '@mui/material/styles' {
  interface Mixins {
    toolbar: {
      minHeight: number
      paddingLeft?: string
      paddingRight?: string
      '@media (min-width:600px)'?: {
        minHeight: number
      }
    }
  }

  interface Theme {
    customShadows: CustomShadowOptions
  }

  interface ThemeOptions {
    customShadows?: CustomShadowOptions
  }
}
