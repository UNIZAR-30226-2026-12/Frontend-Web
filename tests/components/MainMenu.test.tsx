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

  it('clears the token and navigates home on logout', async () => {
    const onNavigate = vi.fn()
    render(<MainMenu onNavigate={onNavigate} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesion' }))

    expect(localStorage.getItem('token')).toBeNull()
    expect(onNavigate).toHaveBeenCalledWith('home')
  })

  it('creates a 1vs1 AI game and navigates to the board', async () => {
    const onNavigate = vi.fn()
    render(<MainMenu onNavigate={onNavigate} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Jugar contra la IA' }))
    fireEvent.click(screen.getByRole('button', { name: 'Elegir IA 1vs1' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith('vs_ai_skills')
    })

    expect(onNavigate).toHaveBeenCalledWith(
      'game-1vs1',
      expect.objectContaining({
        matchData: expect.objectContaining({
          gameId: '77',
          playerName: 'Ada',
          playerRR: 1420,
          opponentName: 'IA',
          opponentRR: 1000,
        }),
      }),
    )
  })

  it('creates a four-player AI game, adds bots and navigates to the board', async () => {
    const onNavigate = vi.fn()
    createMock.mockResolvedValueOnce({ game_id: 99 })

    render(<MainMenu onNavigate={onNavigate} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Jugar contra la IA' }))
    fireEvent.click(screen.getByRole('button', { name: 'Elegir IA 4 jugadores' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith('1vs1vs1vs1_skills')
    })

    await waitFor(() => {
      expect(addBotMock).toHaveBeenCalledTimes(3)
    })
    expect(addBotMock).toHaveBeenNthCalledWith(1, '99')
    expect(addBotMock).toHaveBeenNthCalledWith(2, '99')
    expect(addBotMock).toHaveBeenNthCalledWith(3, '99')

    expect(onNavigate).toHaveBeenCalledWith(
      'game-1v1v1v1',
      expect.objectContaining({
        matchData: expect.objectContaining({
          gameId: '99',
          myUsername: 'Ada',
          players: expect.arrayContaining([
            expect.objectContaining({ name: 'Ada', rr: 1420 }),
            expect.objectContaining({ name: 'IA_1' }),
            expect.objectContaining({ name: 'IA_2' }),
            expect.objectContaining({ name: 'IA_3' }),
          ]),
        }),
      }),
    )
  })
})
