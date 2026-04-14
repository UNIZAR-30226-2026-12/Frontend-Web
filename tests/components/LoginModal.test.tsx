import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loginMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
}))

vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      login: loginMock,
    },
  },
}))

vi.mock('../../src/components/Modal', () => ({
  default: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}))

import LoginModal from '../../src/components/LoginModal'

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sends credentials, stores the token and navigates on successful login', async () => {
    const onClose = vi.fn()
    const onNavigate = vi.fn()
    loginMock.mockResolvedValue({ access_token: 'token-xyz' })

    render(
      <LoginModal
        isOpen
        onClose={onClose}
        onNavigate={onNavigate}
        onForgotPassword={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Tu Usuario o Correo'), {
      target: { value: 'jugador' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1)
    })

    const sentParams = loginMock.mock.calls[0][0] as URLSearchParams
    expect(sentParams.get('username')).toBe('jugador')
    expect(sentParams.get('password')).toBe('clave123')
    expect(localStorage.getItem('token')).toBe('token-xyz')
    expect(onNavigate).toHaveBeenCalledWith('menu')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the backend error when login fails', async () => {
    loginMock.mockRejectedValue(new Error('Credenciales inválidas'))

    render(
      <LoginModal
        isOpen
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onForgotPassword={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Tu Usuario o Correo'), {
      target: { value: 'jugador' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'mal' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('toggles password visibility', () => {
    render(
      <LoginModal
        isOpen
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onForgotPassword={vi.fn()}
      />,
    )

    const passwordInput = screen.getByLabelText('Contraseña')
    const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()
  })

  it('closes the modal and opens forgot password flow', () => {
    const onClose = vi.fn()
    const onForgotPassword = vi.fn()

    render(
      <LoginModal
        isOpen
        onClose={onClose}
        onNavigate={vi.fn()}
        onForgotPassword={onForgotPassword}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '¿Has olvidado tu contraseña?' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onForgotPassword).toHaveBeenCalledTimes(1)
  })
})
