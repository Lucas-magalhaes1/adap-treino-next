import { Theme } from "@mui/material";
import Button from "./Button";
import List from "./List";
import Chip from "./Chip";
//import Select from "./Select";

function ComponentsOverrides(theme: Theme) {
  return Object.assign(Button(theme), List(theme), Chip(theme));
}

export default ComponentsOverrides;
