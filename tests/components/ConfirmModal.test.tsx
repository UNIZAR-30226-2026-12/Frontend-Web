import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/components/Modal', () => ({
  default: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}))

import ConfirmModal from '../../src/components/ConfirmModal'

describe('ConfirmModal', () => {
  it('renders the provided title and message when open', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar amigo"
        message="Esta accion no se puede deshacer"
      />,
    )

    expect(screen.getByText('Eliminar amigo')).toBeInTheDocument()
    expect(screen.getByText('Esta accion no se puede deshacer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('calls the close and confirm handlers from the action buttons', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Cerrar sala"
        message="Se expulsara a todos los jugadores"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons and shows the loading label while processing', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar partida"
        message="La partida desaparecera"
        confirmLabel="Eliminar"
        isLoading
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
  })
})
