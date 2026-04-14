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
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith('correo@ejemplo.com')
    })

    expect(
      await screen.findByText('Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.'),
    ).toBeInTheDocument()
  })

  it('shows the backend error when the request fails', async () => {
    forgotPasswordMock.mockRejectedValue(new Error('Correo no encontrado'))

    render(<ForgotPasswordModal isOpen onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'correo@ejemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    expect(await screen.findByText('Correo no encontrado')).toBeInTheDocument()
  })

  it('resets the state when it is closed', async () => {
    const onClose = vi.fn()
    forgotPasswordMock.mockResolvedValue({ message: 'ok' })

    render(<ForgotPasswordModal isOpen onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'correo@ejemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    expect(
      await screen.findByText('Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('usuario@ejemplo.com')).toHaveValue('')
  })
})
