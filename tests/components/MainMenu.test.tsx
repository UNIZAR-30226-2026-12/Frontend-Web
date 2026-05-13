import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMeMock, createMock, addBotMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  createMock: vi.fn(),
  addBotMock: vi.fn(),
}))

vi.mock('../../src/services/api', () => ({
  api: {
    users: {
      getMe: getMeMock,
    },
    games: {
      create: createMock,
      addBot: addBotMock,
    },
  },
}))

vi.mock('../../src/config/avatarOptions', () => ({
  resolveUserAvatar: () => 'avatar.png',
}))

vi.mock('../../src/components/GameModal', () => ({
  default: ({ isOpen, onClose, onSelectMode, isLoading }: any) =>
    isOpen ? (
      <div>
        <span>Game modal abierto</span>
        <button onClick={onClose}>Cerrar modal IA</button>
        <button onClick={() => onSelectMode('1vs1')} disabled={isLoading}>
          Elegir IA 1vs1
        </button>
        <button onClick={() => onSelectMode('1vs1vs1vs1')} disabled={isLoading}>
          Elegir IA 4 jugadores
        </button>
      </div>
    ) : null,
}))

import MainMenu from '../../src/pages/MainMenu'

describe('MainMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', 'token-123')
    getMeMock.mockResolvedValue({ username: 'Ada', elo: 1420, avatar_url: 'ada.png' })
    createMock.mockResolvedValue({ game_id: 77 })
    addBotMock.mockResolvedValue({})
  })

  it('returns to home when there is no token', async () => {
    localStorage.removeItem('token')
    const onNavigate = vi.fn()

    render(<MainMenu onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('home')
    })
    expect(getMeMock).not.toHaveBeenCalled()
  })

  it('loads the current user information', async () => {
    render(<MainMenu onNavigate={vi.fn()} />)

    expect(await screen.findByRole('button', { name: 'Ver perfil de Ada' })).toBeInTheDocument()
    expect(screen.getByText('1420 RR')).toBeInTheDocument()
  })

})
