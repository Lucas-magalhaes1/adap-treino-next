'use client'

import { Delete, Edit, EmojiEvents, Visibility } from '@mui/icons-material'
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material'
import { Drawer } from 'vaul'

interface AthleteActionsDrawerProps {
  open: boolean
  onClose: () => void
  athleteName: string
  athleteId: number
  onView: () => void
  onEdit: () => void
  onGoals: () => void
  onDelete: () => void
}

export function AthleteActionsDrawer({
  open,
  onClose,
  athleteName,
  athleteId,
  onView,
  onEdit,
  onGoals,
  onDelete,
}: AthleteActionsDrawerProps) {
  const theme = useTheme()

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Portal>
        {/* Backdrop */}
        <Drawer.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1200,
          }}
        />

        {/* Drawer Content */}
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            backgroundColor: theme.vars?.palette.background.default,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            outline: 'none',
            maxHeight: '85vh',
          }}
          aria-describedby="athlete-actions-description"
        >
          {/* Título acessível (oculto visualmente) */}
          <Drawer.Title
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            }}
          >
            Ações do atleta {athleteName}
          </Drawer.Title>

          {/* Descrição acessível (oculta visualmente) */}
          <Drawer.Description
            id="athlete-actions-description"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            }}
          >
            Escolha uma ação para {athleteName}: visualizar perfil, gerenciar metas ou deletar
            atleta
          </Drawer.Description>

          {/* Handle (barra para arrastar) */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              pt: 1.5,
              pb: 1,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'divider',
              }}
            />
          </Box>

          {/* Header */}
          <Box sx={{ px: 3, py: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              fontWeight="600"
              color="primary"
              textAlign="center"
            >
              {athleteName}
            </Typography>
          </Box>

          {/* Actions List */}
          <List sx={{ px: 2, pb: 3 }}>
            {/* Visualizar Atleta */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onView()
                  onClose()
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Visibility color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Visualizar Atleta"
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Editar */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onEdit()
                  onClose()
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Edit color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Editar"
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Metas */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onGoals()
                  onClose()
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <EmojiEvents color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Metas"
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {/* Deletar */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onDelete()
                  onClose()
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Delete color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Deletar"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    color: 'error.main',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
