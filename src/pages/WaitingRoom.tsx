import { useEffect, useMemo, useRef, useState } from 'react'
import { api, WS_BASE_URL } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/WaitingRoom.css'

interface Player {
    id: number
    username: string
    rr: number
    avatar_url?: string
    is_ready: boolean
}

interface GameHistory {
    id: number
    mode: string
    result: 'Ganada' | 'Perdida' | 'Empate'
    score: string
}

interface WaitingRoomProps {
    gameMode: '1vs1' | '1vs1vs1vs1'
    gameId?: string | number
    returnScreen: string
    onNavigate: (screen: string, data?: any) => void
}

type HistoryPreviewSymbol = 'V' | 'D' | 'E' | '-'

const EMPTY_HISTORY_PREVIEW: HistoryPreviewSymbol[] = ['-', '-', '-', '-', '-']

const buildHistoryPreview = (history: GameHistory[], gameMode: WaitingRoomProps['gameMode']): HistoryPreviewSymbol[] => {
    const acceptedModes = gameMode === '1vs1' ? new Set(['1vs1', '1v1']) : new Set(['1vs1vs1vs1'])
    const filteredHistory = history.filter(item =>
        acceptedModes.has(item.mode),
    )

    const recentSymbols: HistoryPreviewSymbol[] = filteredHistory
        .slice(0, 5)
        .map((item) => {
            if (item.result === 'Ganada') return 'V'
            if (item.result === 'Perdida') return 'D'
            return 'E'
        })

    const symbols = [...recentSymbols].reverse()
    while (symbols.length < 5) symbols.unshift('-')
    return symbols
}

function WaitingRoom({ gameMode, gameId, returnScreen, onNavigate }: WaitingRoomProps) {
    const [players, setPlayers] = useState<Player[]>([])
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing'>('waiting')
    const [myUsername, setMyUsername] = useState<string>('')
    const [myUserId, setMyUserId] = useState<number | null>(null)
    const [toast, setToast] = useState<string>('')
    const [historyByPlayer, setHistoryByPlayer] = useState<Record<number, HistoryPreviewSymbol[]>>({})
    const wsRef = useRef<WebSocket | null>(null)
    const loadedHistoryRef = useRef<Set<number>>(new Set())
    const playersRef = useRef<Player[]>([])
    const hasNavigatedToGameRef = useRef(false)

    const maxPlayers = gameMode === '1vs1' ? 2 : 4
    const isFull = players.length >= maxPlayers
    const localPlayer = players.find(p =>
        (myUserId !== null && p.id === myUserId) || (myUsername && p.username === myUsername),
    )
    const allReady = isFull && players.every(player => player.is_ready)

    useEffect(() => {
        playersRef.current = players
    }, [players])

    const fetchPlayerHistoryPreview = async (playerId: number) => {
        if (loadedHistoryRef.current.has(playerId)) return
        loadedHistoryRef.current.add(playerId)
        try {
            const history = await api.users.getHistory(playerId)
            setHistoryByPlayer(prev => ({
                ...prev,
                [playerId]: buildHistoryPreview(history, gameMode),
            }))
        } catch {
            setHistoryByPlayer(prev => ({
                ...prev,
                [playerId]: EMPTY_HISTORY_PREVIEW,
            }))
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                const me = await api.users.getMe()
                setMyUsername(me.username)
                setMyUserId(me.id)
            } catch {
                setToast('No se pudo cargar tu usuario')
            }
        }
        init()
    }, [])

    const navigateToGame = () => {
        if (hasNavigatedToGameRef.current || !gameId) return
        const allPlayers = playersRef.current
        if (allPlayers.length < 2) return

        let me = allPlayers.find(player =>
            (myUserId !== null && player.id === myUserId) || (myUsername && player.username === myUsername),
        )
        if (!me && myUserId === null && !myUsername) {
            return
        }

        const opponent = allPlayers.find(player => (me ? player.id !== me.id : true))
        if (!opponent) return

        if (!me && allPlayers.length === 2) {
            me = allPlayers.find(player => player.id !== opponent.id)
        }
        if (!me) return

        hasNavigatedToGameRef.current = true
        onNavigate('game-1vs1', {
            matchData: {
                online: true,
                gameId: String(gameId),
                playerName: me.username,
                playerRR: me.rr ?? 0,
                playerAvatarUrl: me.avatar_url,
                opponentName: opponent.username,
                opponentRR: opponent.rr,
                opponentAvatarUrl: opponent.avatar_url,
            },
        })
    }

    useEffect(() => {
        if (!gameId) return
        const loadState = async () => {
            try {
                const state = await api.games.getLobbyState(gameId)
                const nextPlayers: Player[] = state.players ?? []
                setPlayers(nextPlayers)
                setRoomStatus(state.status === 'playing' ? 'playing' : 'waiting')
                nextPlayers.forEach(player => {
                    fetchPlayerHistoryPreview(player.id)
                })
                if (state.status === 'playing') {
                    navigateToGame()
                }
            } catch (err: any) {
                setToast(err.message || 'No se pudo cargar la sala')
            }
        }
        loadState()
        const poll = window.setInterval(loadState, 1500)
        return () => window.clearInterval(poll)
    }, [gameId, gameMode])

    useEffect(() => {
        if (!gameId) return
        const token = localStorage.getItem('token')
        if (!token) return

        const wsUrl = `${WS_BASE_URL}/ws/play/${encodeURIComponent(String(gameId))}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data?.type === 'room_sync' && data?.payload) {
                    const payloadPlayers: Player[] = data.payload.players ?? []
                    setPlayers(payloadPlayers)
                    setRoomStatus(data.payload.status === 'playing' ? 'playing' : 'waiting')
                    payloadPlayers.forEach(player => fetchPlayerHistoryPreview(player.id))
                }

                if (data?.type === 'waiting_for_player') {
                    setRoomStatus('waiting')
                }

                if (data?.type === 'game_state_update' && data?.payload?.status === 'playing') {
                    navigateToGame()
                }

                if (data?.type === 'error' && data?.payload?.message) {
                    setToast(data.payload.message)
                }
            } catch {
                // Ignore malformed websocket payloads
            }
        }

        ws.onclose = () => {
            wsRef.current = null
        }

        return () => {
            ws.close()
            wsRef.current = null
        }
    }, [gameId, myUsername, onNavigate])

    const handleReady = async () => {
        if (!localPlayer || !gameId) return
        const nextReady = !localPlayer.is_ready

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'set_ready',
                ready: nextReady,
            }))
            return
        }

        try {
            await api.games.setReady(gameId, nextReady)
            const state = await api.games.getLobbyState(gameId)
            setPlayers(state.players ?? [])
            setRoomStatus(state.status === 'playing' ? 'playing' : 'waiting')
            if (state.status === 'playing') {
                navigateToGame()
            }
        } catch (err: any) {
            setToast(err.message || 'No se pudo actualizar estado listo')
        }
    }

    const handleLeave = async () => {
        if (!gameId) {
            onNavigate(returnScreen)
            return
        }
        try {
            await api.games.leaveLobby(gameId)
        } catch {
            // If lobby was already deleted by the other player, still leave screen
        } finally {
            onNavigate('friends')
        }
    }

    const statusText = useMemo(() => {
        if (allReady || roomStatus === 'playing') return 'INICIANDO PARTIDA...'
        if (isFull) return 'SALA LLENA'
        return 'ESPERANDO JUGADORES...'
    }, [allReady, isFull, roomStatus])

    return (
        <div className="waiting-room">
            <div className="home__bg">
                <span className="home__chip home__chip--1">O</span>
                <span className="home__chip home__chip--2">O</span>
                <span className="home__chip home__chip--3">R</span>
                <span className="home__chip home__chip--4">B</span>
                <span className="home__chip home__chip--5">G</span>
                <span className="home__chip home__chip--6">Y</span>
                <span className="home__chip home__chip--7">P</span>
                <span className="home__chip home__chip--8">O</span>
            </div>

            <div className="waiting-room__container">
                <header className="waiting-room__header">
                    <h1 className="waiting-room__title">Sala de Espera</h1>
                    <span className="waiting-room__mode-tag">{gameMode}</span>
                </header>

                <div className="waiting-room__animation">
                    <div className="waiting-room__chip-3d"></div>
                </div>

                <p className="waiting-room__loading-text">{statusText}</p>
                {toast && <p className="waiting-room__loading-text" style={{ color: '#fca5a5' }}>{toast}</p>}

                <div className="waiting-room__players">
                    {Array.from({ length: maxPlayers }).map((_, index) => {
                        const player = players[index]
                        const historyPreview = player ? (historyByPlayer[player.id] ?? EMPTY_HISTORY_PREVIEW) : EMPTY_HISTORY_PREVIEW

                        return (
                            <div
                                key={index}
                                className={`player-slot ${player ? 'player-slot--active' : 'player-slot--empty'} ${player?.is_ready ? 'player-slot--ready' : ''}`}
                            >
                                <div className="player-slot__avatar">
                                    {player ? (
                                        <>
                                            <img
                                                className="player-slot__avatar-img"
                                                src={resolveUserAvatar(player.avatar_url, player.username)}
                                                alt={`Avatar de ${player.username}`}
                                            />
                                            {player.is_ready && (
                                                <span className="player-slot__ready-badge" aria-label="Jugador listo">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </span>
                                            )}
                                        </>
                                    ) : '?'}
                                </div>

                                <div className="player-slot__details">
                                    <span className="player-slot__name">{player ? player.username : 'Esperando...'}</span>
                                    {player && (
                                        <span className="player-slot__streak" aria-label="Racha ultimas 5 partidas">
                                            {historyPreview.map((result, resultIndex) => (
                                                <span
                                                    key={`${player.id}-streak-${resultIndex}`}
                                                    className={`player-slot__streak-item ${result === 'V'
                                                        ? 'player-slot__streak-item--win'
                                                        : result === 'D'
                                                            ? 'player-slot__streak-item--loss'
                                                            : 'player-slot__streak-item--empty'}`}
                                                >
                                                    {result}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                    {player && <span className="player-slot__rr">{player.rr} RR</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="waiting-room__actions">
                    <button className="waiting-room__btn waiting-room__btn--leave" onClick={handleLeave}>
                        Abandonar Sala
                    </button>
                    <button
                        className={`waiting-room__btn waiting-room__btn--ready ${localPlayer?.is_ready ? 'waiting-room__btn--is-ready' : ''}`}
                        disabled={roomStatus === 'playing' || !localPlayer}
                        onClick={handleReady}
                    >
                        {localPlayer?.is_ready ? 'Listo' : 'Estoy Listo'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WaitingRoom
