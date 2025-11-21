import { Container } from '@mui/material'
import { ReactNode } from 'react'

interface AppMaxWidthContainerProps {
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
}

export function AppMaxWidthContainer({ children, maxWidth = 'md' }: AppMaxWidthContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        width: '100%',
        minHeight: '100vh',
        px: { xs: 2, sm: 3 },
      }}
    >
      {children}
    </Container>
  )
}
