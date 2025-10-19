import { Theme } from "@mui/material";

export default function List(theme: Theme) {
  return {
    MuiList: {
      styleOverrides: {
        root: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        padding: {
          paddingTop: theme.spacing(1),
          paddingBottom: theme.spacing(1),
        },
        dense: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: theme.spacing(1),
          paddingBottom: theme.spacing(1),
          borderRadius: theme.spacing(1),
          marginBottom: theme.spacing(0.5),
          transition: theme.transitions.create(
            ["background-color", "box-shadow"],
            {
              duration: theme.transitions.duration.shorter,
            }
          ),
          "&:hover": {
            backgroundColor: "var(--mui-palette-action-hover)",
          },
          "&:last-child": {
            marginBottom: 0,
          },
        },
        button: {
          "&:hover": {
            backgroundColor: "var(--mui-palette-action-hover)",
            boxShadow: "var(--mui-customShadows-z1)",
          },
          "&:focus": {
            backgroundColor: "var(--mui-palette-action-focus)",
            boxShadow: "var(--mui-customShadows-z2)",
          },
        },
        dense: {
          paddingTop: theme.spacing(0.5),
          paddingBottom: theme.spacing(0.5),
        },
        divider: {
          borderBottom: `1px solid var(--mui-palette-divider)`,
        },
        selected: {
          backgroundColor: "var(--mui-palette-action-selected)",
          "&:hover": {
            backgroundColor: "var(--mui-palette-action-selected)",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: theme.spacing(0.5),
          margin: theme.spacing(0, 0.5),
          minHeight: 44,
          color: "var(--mui-palette-text-secondary)",
          transition: theme.transitions.create(
            ["background-color", "color", "box-shadow"],
            {
              duration: theme.transitions.duration.shorter,
            }
          ),
          "&:hover": {
            backgroundColor: "var(--mui-palette-action-hover)",
            color: "var(--mui-palette-text-primary)",
            boxShadow: "var(--mui-customShadows-z1)",
          },
          "&:focus": {
            backgroundColor: "var(--mui-palette-action-selected)",
            color: "var(--mui-palette-text-contrastText)",
          },
        },
        selected: {
          backgroundColor: "var(--mui-palette-background-active)",
          color: "var(--mui-palette-text-contrastText)",
          "&:hover": {
            backgroundColor: "var(--mui-palette-background-active)",
          },
          "&:focus": {
            backgroundColor: "var(--mui-palette-action-selected)",
          },
        },
        dense: {
          minHeight: 36,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "var(--mui-palette-text-secondary)",
          marginRight: theme.spacing(2),
          minWidth: 0,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        color: "var(--mui-palette-text-menu)",
        root: {
          margin: 0,
        },
        primary: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.5,
        },
        secondary: {
          fontSize: 12,
          color: "var(--mui-palette-text-secondary)",
          lineHeight: 1.4,
        },
        dense: {
          "& .MuiListItemText-primary": {
            fontSize: 13,
          },
          "& .MuiListItemText-secondary": {
            fontSize: 11,
          },
        },
      },
    },
    MuiListItemAvatar: {
      styleOverrides: {
        root: {
          minWidth: 48,
          marginRight: theme.spacing(1),
        },
      },
    },
    // MuiListSubheader: {
    //   styleOverrides: {
    //     root: {
    //       backgroundColor: theme.palette.background.default,
    //       color: theme.palette.text.primary,
    //       fontSize: 12,
    //       fontWeight: 600,
    //       lineHeight: 1.5,
    //       paddingTop: theme.spacing(2),
    //       paddingBottom: theme.spacing(1),
    //       textTransform: "uppercase",
    //       letterSpacing: 0.5,
    //     },
    //     colorPrimary: {
    //       color: theme.palette.primary.main,
    //     },
    //     colorInherit: {
    //       color: theme.palette.text.secondary,
    //     },
    //     gutters: {
    //       paddingLeft: theme.spacing(2),
    //       paddingRight: theme.spacing(2),
    //     },
    //     inset: {
    //       paddingLeft: theme.spacing(9),
    //     },
    //     sticky: {
    //       backgroundColor: theme.palette.background.paper,
    //       boxShadow: theme.customShadows?.z1,
    //     },
    //   },
    // },
    MuiListItemSecondaryAction: {
      styleOverrides: {
        root: {
          right: theme.spacing(1),
        },
      },
    },
  };
}
