import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Friends from '../src/pages/Friends'
import { api } from '../src/services/api'

vi.mock('../src/services/api', () => ({
  api: {
    friends: {
      list: vi.fn(),
      sendRequest: vi.fn(),
      acceptRequest: vi.fn(),
      rejectRequest: vi.fn(),
      remove: vi.fn(),
      getChat: vi.fn(),
      sendChatMessage: vi.fn(),
      markChatRead: vi.fn(),
    },
    games: {
      invite: vi.fn(),
      acceptInvite: vi.fn(),
      rejectInvite: vi.fn(),
      leaveLobby: vi.fn(),
      getLobbyState: vi.fn(),
      setReady: vi.fn(),
      getPublic: vi.fn(),
      create: vi.fn(),
      join: vi.fn(),
      addBot: vi.fn(),
    },
  },
  WS_BASE_URL: 'ws://localhost',
}))

vi.mock('../src/config/avatarOptions', () => ({
  resolveUserAvatar: () => 'avatar.png',
}))

const apiMocks = api as unknown as {
  friends: {
    list: ReturnType<typeof vi.fn>
    sendRequest: ReturnType<typeof vi.fn>
    acceptRequest: ReturnType<typeof vi.fn>
    rejectRequest: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    getChat: ReturnType<typeof vi.fn>
    sendChatMessage: ReturnType<typeof vi.fn>
    markChatRead: ReturnType<typeof vi.fn>
  }
  games: {
    invite: ReturnType<typeof vi.fn>
    acceptInvite: ReturnType<typeof vi.fn>
    rejectInvite: ReturnType<typeof vi.fn>
    leaveLobby: ReturnType<typeof vi.fn>
    getLobbyState: ReturnType<typeof vi.fn>
    setReady: ReturnType<typeof vi.fn>
    getPublic: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    join: ReturnType<typeof vi.fn>
    addBot: ReturnType<typeof vi.fn>
  }
}

const baseFriendsResponse = {
  online: [
    { id: 1, name: 'Bat', rr: 1478, status: 'online', avatar_url: 'bat.png', unread_count: 0 },
    { id: 2, name: 'Jokin', rr: 325, status: 'online', avatar_url: 'jokin.png', unread_count: 0 },
    { id: 3, name: 'Motes', rr: 0, status: 'online', avatar_url: 'motes.png', unread_count: 0 },
  ],
  offline: [
    { id: 4, name: 'zelan', rr: 1260, status: 'offline', avatar_url: 'zelan.png', unread_count: 0 },
  ],
  requests: [],
  gameRequests: [],
  pausedGames: [],
}

describe('Friends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.friends.list.mockResolvedValue(baseFriendsResponse)
    apiMocks.friends.getChat.mockResolvedValue({ messages: [] })
    apiMocks.friends.markChatRead.mockResolvedValue({})
    apiMocks.games.invite.mockResolvedValue({ game_id: 999 })
    apiMocks.games.leaveLobby.mockResolvedValue({})
  })

  it('muestra las partidas pausadas con el modo visual normalizado y permite reanudar', async () => {
    apiMocks.friends.list.mockResolvedValue({
      ...baseFriendsResponse,
      pausedGames: [
        {
          game_id: 124,
          mode: '1vs1_skills',
          participants: ['Juan', 'Pedro'],
          paused_by: ['Juan'],
          active_players: ['Juan', 'Pedro'],
        },
      ],
    })

    const onNavigate = vi.fn()
    render(<Friends onNavigate={onNavigate} />)

    expect(await screen.findByText('Partida en pausa')).toBeInTheDocument()
    expect(screen.getByText('1vs1')).toBeInTheDocument()
    expect(screen.queryByText(/skills/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reanudar' }))

    expect(onNavigate).toHaveBeenCalledWith('waiting-room', {
      mode: '1vs1',
      gameId: 124,
      returnTo: 'friends',
      isResume: true,
    })
  })

})
