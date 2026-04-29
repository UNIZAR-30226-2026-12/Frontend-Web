import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { forgotPasswordMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
}))

vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      forgotPassword: forgotPasswordMock,
    },
  },
}))

vi.mock('../../src/components/Modal', () => ({
  default: ({ isOpen, onClose, children }: any) =>
    isOpen ? (
      <div>
        <button onClick={onClose}>Cerrar modal</button>
        {children}
      </div>
    ) : null,
}))

import ForgotPasswordModal from '../../src/components/ForgotPasswordModal'

describe('ForgotPasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the api and shows the success message', async () => {
    forgotPasswordMock.mockResolvedValue({ message: 'ok' })

    render(<ForgotPasswordModal isOpen onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'correo@ejemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/i }))

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith('correo@ejemplo.com')
    })

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.',
    )
  })

  it('shows the backend error when the request fails', async () => {
    forgotPasswordMock.mockRejectedValue(new Error('Correo no encontrado'))

    render(<ForgotPasswordModal isOpen onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'correo@ejemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/i }))

    expect(await screen.findByText('Correo no encontrado')).toBeInTheDocument()
  })

  it('resets the state when it is closed', async () => {
    const onClose = vi.fn()
    forgotPasswordMock.mockResolvedValue({ message: 'ok' })

    render(<ForgotPasswordModal isOpen onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'correo@ejemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Revise la bandeja de entrada de su correo electrÃ³nico para restablecer su contraseÃ±a.')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('usuario@ejemplo.com')).toHaveValue('')
  })

  it('clears the previous error when a new submit starts', async () => {
    forgotPasswordMock
      .mockRejectedValueOnce(new Error('Correo no encontrado'))
      .mockResolvedValueOnce({ message: 'ok' })

    render(<ForgotPasswordModal isOpen onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'correo@ejemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/i }))

    expect(await screen.findByText('Correo no encontrado')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/i }))

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledTimes(2)
    })
    expect(screen.queryByText('Correo no encontrado')).not.toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.',
    )
  })
})
