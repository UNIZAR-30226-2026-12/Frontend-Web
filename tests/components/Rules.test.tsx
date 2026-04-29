import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Rules from '../../src/pages/Rules'

describe('Rules', () => {
  it('shows the core rule sections for the player', () => {
    render(<Rules onNavigate={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Reglas del juego' })).toBeInTheDocument()
    expect(screen.getByText('Como jugar')).toBeInTheDocument()
    expect(screen.getByText('Uso de habilidades')).toBeInTheDocument()
    expect(screen.getByText('Habilidades disponibles')).toBeInTheDocument()
    expect(screen.getByText(/^1vs1:$/i)).toBeInTheDocument()
    expect(screen.getByText(/^1vs1vs1vs1:$/i)).toBeInTheDocument()
  })

  it('returns to the main menu from the back button', () => {
    const onNavigate = vi.fn()

    render(<Rules onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Volver al menu' }))

    expect(onNavigate).toHaveBeenCalledWith('menu')
  })
})
