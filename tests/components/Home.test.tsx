import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/components/LoginModal', () => ({
  default: ({ isOpen, onClose, onForgotPassword }: any) =>
    isOpen ? (
      <div>
        <span>Login modal abierto</span>
        <button onClick={onClose}>Cerrar login</button>
        <button
          onClick={() => {
            onClose()
            onForgotPassword()
          }}
        >
          Ir a recuperar
        </button>
      </div>
    ) : null,
}))

vi.mock('../../src/components/RegisterModal', () => ({
  default: ({ isOpen, onClose, onRegisterSuccess }: any) =>
    isOpen ? (
      <div>
        <span>Register modal abierto</span>
        <button onClick={onClose}>Cerrar register</button>
        <button
          onClick={() => {
            onRegisterSuccess()
          }}
        >
          Simular registro correcto
        </button>
      </div>
    ) : null,
}))

vi.mock('../../src/components/ForgotPasswordModal', () => ({
  default: ({ isOpen }: any) => (isOpen ? <div>Forgot password modal abierto</div> : null),
}))

import Home from '../../src/pages/Home'

describe('Home', () => {
  it('opens the login modal from the main action button', () => {
    render(<Home onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    expect(screen.getByText('Login modal abierto')).toBeInTheDocument()
  })

  it('opens the register modal from the secondary action button', () => {
    render(<Home onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }))

    expect(screen.getByText('Register modal abierto')).toBeInTheDocument()
  })

  it('opens the forgot password modal from the login flow', () => {
    render(<Home onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ir a recuperar' }))

    expect(screen.queryByText('Login modal abierto')).not.toBeInTheDocument()
    expect(screen.getByText('Forgot password modal abierto')).toBeInTheDocument()
  })

  it('returns to the login modal after a successful register flow', () => {
    render(<Home onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Simular registro correcto' }))

    expect(screen.queryByText('Register modal abierto')).not.toBeInTheDocument()
    expect(screen.getByText('Login modal abierto')).toBeInTheDocument()
  })
})
