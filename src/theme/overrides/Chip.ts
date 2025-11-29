import { useMix } from '@/utils/useMix'
import type { Components, Theme } from '@mui/material'

export default function Chip(theme: Theme): Components<Theme> {
  return {
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          letterSpacing: 0.15,
          backdropFilter: 'blur(4px)',
          transition: theme.transitions.create(
            ['background-color', 'box-shadow', 'color', 'border-color'],
            { duration: theme.transitions.duration.shorter }
          ),
          '&.MuiChip-clickable:hover': {
            boxShadow: 'var(--mui-customShadows-z2)',
          },
        },
        sizeSmall: {
          fontSize: 12,
          height: 24,
        },
        sizeMedium: {
          fontSize: 13,
          height: 28,
        },
        filled: {
          backgroundColor: useMix('var(--mui-palette-primary-main)', 85),
          color: 'var(--mui-palette-text-secondary)',
          border: '1px solid var(--mui-palette-divider)',
          '& .MuiChip-deleteIcon': {
            color: 'var(--mui-palette-text-disabled)',
            '&:hover': { color: 'var(--mui-palette-text-primary)' },
          },
        },
        outlined: {
          backgroundColor: useMix('var(--mui-palette-background-default)', 60),
          color: 'var(--mui-palette-text-secondary)',
          border: '1px solid var(--mui-palette-divider)',
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-background-default)', 75),
          },
        },
        colorPrimary: {
          backgroundColor: useMix('var(--mui-palette-primary-main)', 18),
          color: 'var(--mui-palette-primary-main)',
          border: '1px solid ' + useMix('var(--mui-palette-primary-main)', 30),
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-primary-main)', 28),
          },
        },
        colorSecondary: {
          backgroundColor: useMix('var(--mui-palette-secondary-main)', 18),
          color: 'var(--mui-palette-secondary-main)',
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-secondary-main)', 28),
          },
        },
        colorSuccess: {
          backgroundColor: useMix('var(--mui-palette-success-main)', 18),
          color: 'var(--mui-palette-success-main)',
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-success-main)', 28),
          },
        },
        colorError: {
          backgroundColor: useMix('var(--mui-palette-error-main)', 18),
          color: 'var(--mui-palette-error-main)',
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-error-main)', 28),
          },
        },
        colorWarning: {
          backgroundColor: useMix('var(--mui-palette-warning-main)', 18),
          color: 'var(--mui-palette-warning-main)',
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-warning-main)', 28),
          },
        },
        colorInfo: {
          backgroundColor: useMix('var(--mui-palette-info-main)', 18),
          color: 'var(--mui-palette-info-main)',
          '&.MuiChip-clickable:hover': {
            backgroundColor: useMix('var(--mui-palette-info-main)', 28),
          },
        },
        avatar: {
          color: 'inherit',
        },
        icon: {
          color: 'inherit',
          fontSize: 18,
        },
        deleteIcon: {
          fontSize: 18,
          color: 'currentColor',
          opacity: 0.5,
          transition: theme.transitions.create('opacity', {
            duration: theme.transitions.duration.shortest,
          }),
          '&:hover': {
            opacity: 1,
          },
        },
      },
      variants: [
        {
          props: { variant: 'soft' as const },
          style: {
            backgroundColor: useMix('var(--mui-palette-neutral-contrast)', 8),
            color: 'var(--mui-palette-text-primary)',
          },
        },
        {
          props: { variant: 'outlined' as const, color: 'primary' as const },
          style: {
            borderColor: 'var(--mui-palette-primary-main)',
            color: 'var(--mui-palette-primary-main)',
            backgroundColor: 'transparent',
            '&.MuiChip-clickable:hover': {
              backgroundColor: useMix('var(--mui-palette-primary-main)', 12),
            },
          },
        },
        {
          props: { variant: 'outlined' as const, color: 'secondary' as const },
          style: {
            borderColor: 'var(--mui-palette-secondary-main)',
            color: 'var(--mui-palette-secondary-main)',
            '&.MuiChip-clickable:hover': {
              backgroundColor: useMix('var(--mui-palette-secondary-main)', 12),
            },
          },
        },
        {
          props: { variant: 'outlined' as const, color: 'success' as const },
          style: {
            borderColor: 'var(--mui-palette-success-main)',
            color: 'var(--mui-palette-success-main)',
            '&.MuiChip-clickable:hover': {
              backgroundColor: useMix('var(--mui-palette-success-main)', 12),
            },
          },
        },
        {
          props: { variant: 'outlined' as const, color: 'error' as const },
          style: {
            borderColor: 'var(--mui-palette-error-main)',
            color: 'var(--mui-palette-error-main)',
            '&.MuiChip-clickable:hover': {
              backgroundColor: useMix('var(--mui-palette-error-main)', 12),
            },
          },
        },
        {
          props: { variant: 'outlined' as const, color: 'warning' as const },
          style: {
            borderColor: 'var(--mui-palette-warning-main)',
            color: 'var(--mui-palette-warning-main)',
            '&.MuiChip-clickable:hover': {
              backgroundColor: useMix('var(--mui-palette-warning-main)', 12),
            },
          },
        },
        {
          props: { variant: 'outlined' as const, color: 'info' as const },
          style: {
            borderColor: 'var(--mui-palette-info-main)',
            color: 'var(--mui-palette-info-main)',
            '&.MuiChip-clickable:hover': {
              backgroundColor: useMix('var(--mui-palette-info-main)', 12),
            },
          },
        },
      ],
    },
  }
}
