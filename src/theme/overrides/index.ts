import type { Components, Theme } from '@mui/material'
import Button from './Button'
import Chip from './Chip'
import List from './List'
//import Select from "./Select";

function ComponentsOverrides(theme: Theme): Components<Theme> {
  return {
    ...Button(theme),
    ...List(theme),
    ...Chip(theme),
  } as Components<Theme>
}

export default ComponentsOverrides
