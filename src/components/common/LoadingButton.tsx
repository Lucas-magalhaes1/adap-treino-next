'use client'

import { Button, ButtonProps, keyframes, styled } from '@mui/material'

const snakeBorder = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
`

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isLoading',
})<{ isLoading?: boolean }>(({ theme, isLoading }) => ({
  position: 'relative',
  ...(isLoading && {
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '2px',
      background: `linear-gradient(
        90deg,
        transparent,
        ${theme.palette.primary.main},
        transparent,
        ${theme.palette.primary.main},
        transparent
      )`,
      backgroundSize: '200% 100%',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      animation: `${snakeBorder} 2s linear infinite`,
    },
  }),
}))

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

/**
 * Botão com efeito snake border durante loading
 *
 * @example
 * ```tsx
 * <LoadingButton
 *   loading={isSubmitting}
 *   loadingText="Salvando..."
 * >
 *   Salvar
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <StyledButton {...props} disabled={loading || disabled} isLoading={loading}>
      {loading && loadingText ? loadingText : children}
    </StyledButton>
  )
}
