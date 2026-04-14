import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Modal from '../../src/components/Modal'

describe('Modal', () => {
  it('does not render when it is closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Hidden content</div>
      </Modal>,
    )

    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('renders its children when it is open', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <div>Visible content</div>
      </Modal>,
    )

    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('closes when the close button is clicked', () => {
    const onClose = vi.fn()

    render(
      <Modal isOpen onClose={onClose}>
        <div>Visible content</div>
      </Modal>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'x' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when mouse down and mouse up happen on the overlay', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal isOpen onClose={onClose}>
        <div>Visible content</div>
      </Modal>,
    )

    const overlay = container.querySelector('.modal-overlay')
    expect(overlay).not.toBeNull()

    fireEvent.mouseDown(overlay!)
    fireEvent.mouseUp(overlay!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when the click starts inside the modal box', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal isOpen onClose={onClose}>
        <div>Visible content</div>
      </Modal>,
    )

    const modalBox = container.querySelector('.modal-box')
    const overlay = container.querySelector('.modal-overlay')

    expect(modalBox).not.toBeNull()
    expect(overlay).not.toBeNull()

    fireEvent.mouseDown(modalBox!)
    fireEvent.mouseUp(overlay!)

    expect(onClose).not.toHaveBeenCalled()
  })
})
