import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/components/Modal', () => ({
  default: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}))

import GameModal from '../../src/components/GameModal'

describe('GameModal', () => {
  it('renders only the modes enabled in availableModes', () => {
    render(<GameModal isOpen onClose={vi.fn()} availableModes={['1vs1']} />)

    expect(screen.getByText('1 vs 1')).toBeInTheDocument()
    expect(screen.queryByText('1 vs 1 vs 1 vs 1')).not.toBeInTheDocument()
  })

  it('notifies the selected mode', () => {
    const onSelectMode = vi.fn()

    render(<GameModal isOpen onClose={vi.fn()} onSelectMode={onSelectMode} />)

    fireEvent.click(screen.getByRole('button', { name: /duelo de 2 jugadores/i }))
    fireEvent.click(screen.getByRole('button', { name: /todos contra todos de 4 jugadores/i }))

    expect(onSelectMode).toHaveBeenNthCalledWith(1, '1vs1')
    expect(onSelectMode).toHaveBeenNthCalledWith(2, '1vs1vs1vs1')
  })

  it('disables mode selection while loading', () => {
    const onSelectMode = vi.fn()

    render(<GameModal isOpen onClose={vi.fn()} onSelectMode={onSelectMode} isLoading />)

    const oneVsOneButton = screen.getByRole('button', { name: /duelo de 2 jugadores/i })
    expect(oneVsOneButton).toBeDisabled()

    fireEvent.click(oneVsOneButton)

    expect(onSelectMode).not.toHaveBeenCalled()
  })
})
