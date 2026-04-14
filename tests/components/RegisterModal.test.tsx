import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { registerMock } = vi.hoisted(() => ({
  registerMock: vi.fn(),
}))

vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      register: registerMock,
    },
  },
}))

vi.mock('../../src/components/Modal', () => ({
  default: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}))

import RegisterModal from '../../src/components/RegisterModal'

describe('RegisterModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates that passwords match before calling the api', async () => {
    render(<RegisterModal isOpen onClose={vi.fn()} onRegisterSuccess={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Tu nombre de usuario'), {
      target: { value: 'nuevoJugador' },
    })
    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'nuevo@correo.com' },
    })

    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave1' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'clave2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('calls onRegisterSuccess after a successful registration', async () => {
    const onRegisterSuccess = vi.fn()
    registerMock.mockResolvedValue({ ok: true })

    render(<RegisterModal isOpen onClose={vi.fn()} onRegisterSuccess={onRegisterSuccess} />)

    fireEvent.change(screen.getByPlaceholderText('Tu nombre de usuario'), {
      target: { value: 'nuevoJugador' },
    })
    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'nuevo@correo.com' },
    })

    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'clave123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        username: 'nuevoJugador',
        email: 'nuevo@correo.com',
        password: 'clave123',
      })
    })

    expect(onRegisterSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows the api error when registration fails', async () => {
    registerMock.mockRejectedValue(new Error('Usuario ya existe'))

    render(<RegisterModal isOpen onClose={vi.fn()} onRegisterSuccess={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Tu nombre de usuario'), {
      target: { value: 'repetido' },
    })
    fireEvent.change(screen.getByPlaceholderText('usuario@ejemplo.com'), {
      target: { value: 'repetido@correo.com' },
    })

    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'clave123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))

    expect(await screen.findByText('Usuario ya existe')).toBeInTheDocument()
  })
})
