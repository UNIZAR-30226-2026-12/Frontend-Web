import { useEffect, useMemo, useRef, useState } from 'react'
import { api, WS_BASE_URL } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import boardImage1v1 from '../assets/salaEspera/Pizarra.png'
import boardImage4Players from '../assets/salaEspera/Pizarra4Jugadores.png'
import titleImage from '../assets/salaEspera/titulo.png'
import drawTokenImage from '../assets/salaEspera/empate.png'
import blackWinTokenImage from '../assets/salaEspera/FichaNegraVictoria.png'
import whiteWinTokenImage from '../assets/salaEspera/FichaVictoriaBlanco.png'
import blackLossTokenImage from '../assets/salaEspera/FichaNegraDerrota.png'
import whiteLossTokenImage from '../assets/salaEspera/FichaBlancaDerrota.png'
import questionMarkImage from '../assets/elementosGenerales/interrogante.png'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import leaveButtonImage from '../assets/elementosGenerales/fichaRoja.png'
import readyButtonImage from '../assets/elementosGenerales/fichaVerde.png'
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
    result: string
    score: string
}

interface WaitingRoomProps {
    gameMode: '1vs1' | '1vs1vs1vs1' | '1v1' | '1v1v1v1'
    gameId?: string | number
    returnScreen: string
    isResume?: boolean
    onNavigate: (screen: string, data?: any) => void
}

type GameModeNormalized = '1vs1' | '1vs1vs1vs1'
type HistoryPreviewSymbol = 'V' | 'D' | 'E' | '1' | '2' | '3' | '4' | '-'

const HISTORY_PREVIEW_LENGTH = 5
const EMPTY_HISTORY_PREVIEW: HistoryPreviewSymbol[] = ['-', '-', '-', '-', '-']

const normalizeGameMode = (mode: WaitingRoomProps['gameMode']): GameModeNormalized => {
    const cleanedMode = String(mode || '').toLowerCase()
    if (cleanedMode === '1vs1' || cleanedMode === '1v1') return '1vs1'
    return '1vs1vs1vs1'
}

const normalizeResultText = (value: string) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

const parsePlacement = (value: string): HistoryPreviewSymbol | null => {
    const placement = String(value || '').match(/[1-4]/)?.[0]
    if (!placement) return null
    return placement as HistoryPreviewSymbol
}

const buildHistoryPreview = (history: GameHistory[], gameMode: GameModeNormalized): HistoryPreviewSymbol[] => {
    const acceptedModes = gameMode === '1vs1'
        ? new Set(['1vs1', '1v1'])
        : new Set(['1vs1vs1vs1', '1v1v1v1'])

    const filteredHistory = history.filter((item) =>
        acceptedModes.has(String(item.mode || '').toLowerCase()),
    )

    const recentSymbols: HistoryPreviewSymbol[] = filteredHistory
        .slice(0, HISTORY_PREVIEW_LENGTH)
        .map((item) => {
            if (gameMode === '1vs1') {
                const normalizedResult = normalizeResultText(item.result)
                if (normalizedResult.includes('ganad') || normalizedResult.includes('victoria')) return 'V'
                if (normalizedResult.includes('perdid') || normalizedResult.includes('derrota')) return 'D'
                return 'E'
            }

            return parsePlacement(item.result) ?? '-'
        })

    const symbols = [...recentSymbols].reverse()
    while (symbols.length < HISTORY_PREVIEW_LENGTH) {
        symbols.unshift('-')
    }

    return symbols
}

const normalizePlayers = (incomingPlayers: Player[]) =>
    [...incomingPlayers].sort((a, b) => {
        if (a.id !== b.id) return a.id - b.id
        return a.username.localeCompare(b.username)
    })

const getHistoryTokenImage = (symbol: HistoryPreviewSymbol, index: number) => {
    if (symbol === 'V' || symbol === '1') {
        return index % 2 === 0 ? blackWinTokenImage : whiteWinTokenImage
    }
    if (symbol === 'D' || symbol === '4') {
        return index % 2 === 0 ? blackLossTokenImage : whiteLossTokenImage
    }
    if (symbol === 'E' || symbol === '2' || symbol === '3') {
        return drawTokenImage
    }
    return null
}

const getHistoryTokenLabel = (symbol: HistoryPreviewSymbol) => {
    if (symbol === 'V' || symbol === '1') return 'Victoria'
    if (symbol === 'D' || symbol === '4') return 'Derrota'
    if (symbol === 'E' || symbol === '2' || symbol === '3') return 'Empate o puesto intermedio'
    return 'Sin dato'
}

function WaitingRoom({ gameMode, gameId, returnScreen, isResume, onNavigate }: WaitingRoomProps) {
    const normalizedGameMode = useMemo(() => normalizeGameMode(gameMode), [gameMode])
    const [players, setPlayers] = useState<Player[]>([])
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing'>('waiting')
    const [myUsername, setMyUsername] = useState<string>('')
    const [myUserId, setMyUserId] = useState<number | null>(null)
    const [toast, setToast] = useState<string>('')
    const [historyByPlayer, setHistoryByPlayer] = useState<Record<number, HistoryPreviewSymbol[]>>({})
    const [isSocketReady, setIsSocketReady] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const loadedHistoryRef = useRef<Set<number>>(new Set())
    const playersRef = useRef<Player[]>([])
    const hasNavigatedToGameRef = useRef(false)
    const myUsernameRef = useRef<string>('')
    const myUserIdRef = useRef<number | null>(null)

    const maxPlayers = normalizedGameMode === '1vs1' ? 2 : 4
    const isFull = players.length >= maxPlayers
    const localPlayer = players.find((player) =>
        (myUserId !== null && player.id === myUserId) || (myUsername && player.username === myUsername),
    )
    const allReady = isFull && players.every((player) => player.is_ready)

    useEffect(() => {
        playersRef.current = players
    }, [players])

    useEffect(() => {
        myUsernameRef.current = myUsername
    }, [myUsername])

    useEffect(() => {
        myUserIdRef.current = myUserId
    }, [myUserId])

    const fetchPlayerHistoryPreview = async (playerId: number) => {
        if (loadedHistoryRef.current.has(playerId)) return
        loadedHistoryRef.current.add(playerId)

        try {
            const history = await api.users.getHistory(playerId)
            setHistoryByPlayer((prev) => ({
                ...prev,
                [playerId]: buildHistoryPreview(history, normalizedGameMode),
            }))
        } catch {
            setHistoryByPlayer((prev) => ({
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

        const currentUserId = myUserIdRef.current
        const currentUsername = myUsernameRef.current
        if (currentUserId === null && !currentUsername) return

        let me = allPlayers.find((player) =>
            (currentUserId !== null && player.id === currentUserId) ||
            (currentUsername && player.username === currentUsername),
        )

        if (normalizedGameMode === '1vs1vs1vs1') {
            if (allPlayers.length < 4) return
            hasNavigatedToGameRef.current = true
            onNavigate('game-1v1v1v1', {
                matchData: {
                    online: true,
                    gameId: String(gameId),
                    myUsername: me?.username ?? currentUsername,
                    players: allPlayers.map((player) => ({
                        id: player.id,
                        name: player.username,
                        rr: player.rr ?? 0,
                        avatar_url: player.avatar_url,
                    })),
                    returnTo: returnScreen,
                },
            })
            return
        }

        const opponent = allPlayers.find((player) => (me ? player.id !== me.id : true))
        if (!opponent) return

        if (!me && allPlayers.length === 2) {
            me = allPlayers.find((player) => player.id !== opponent.id)
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
                returnTo: returnScreen,
            },
        })
    }

    useEffect(() => {
        if (!gameId) return

        const loadState = async () => {
            try {
                const state = await api.games.getLobbyState(gameId)
                const nextPlayers: Player[] = normalizePlayers(state.players ?? [])
                setPlayers(nextPlayers)
                setRoomStatus(state.status === 'playing' ? 'playing' : 'waiting')

                nextPlayers.forEach((player) => {
                    fetchPlayerHistoryPreview(player.id)
                })

                if (state.status === 'playing') {
                    navigateToGame()
                }
            } catch (err: any) {
                setToast(err.message || 'No se pudo cargar la sala')
                if (err.status === 404 || err.message?.includes('no encontrada')) {
                    onNavigate(returnScreen)
                }
            }
        }

        loadState()
        const poll = window.setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return
            loadState()
        }, 1500)

        return () => window.clearInterval(poll)
    }, [gameId, isSocketReady, normalizedGameMode, onNavigate, returnScreen])

    useEffect(() => {
        if (!gameId) return
        const token = localStorage.getItem('token')
        if (!token) return

        const wsUrl = `${WS_BASE_URL}/ws/play/${encodeURIComponent(String(gameId))}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
        ws.onopen = () => setIsSocketReady(true)

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data?.type === 'room_sync' && data?.payload) {
                    const payloadPlayers: Player[] = normalizePlayers(data.payload.players ?? [])
                    setPlayers(payloadPlayers)
                    setRoomStatus(data.payload.status === 'playing' ? 'playing' : 'waiting')
                    payloadPlayers.forEach((player) => fetchPlayerHistoryPreview(player.id))
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
            setIsSocketReady(false)
        }

        return () => {
            ws.close()
            wsRef.current = null
        }
    }, [gameId])

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
            const nextPlayers = normalizePlayers(state.players ?? [])
            setPlayers(nextPlayers)
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
            // If the room no longer exists we still navigate out.
        } finally {
            onNavigate(returnScreen)
        }
    }

    const statusText = useMemo(() => {
        if (allReady || roomStatus === 'playing') return 'INICIANDO PARTIDA...'
        if (isResume) return 'REANUDANDO PARTIDA...'
        if (isFull) return 'SALA LLENA'
        return 'ESPERANDO OPONENTES...'
    }, [allReady, isFull, isResume, roomStatus])

    const helperText = useMemo(() => {
        if (allReady || roomStatus === 'playing') {
            return 'Preparando tablero y jugadores...'
        }
        if (isResume) {
            return 'Recuperando estado de la partida pausada.'
        }
        if (normalizedGameMode === '1vs1') {
            return 'Prepara tu estrategia.\nEsperando a que se una el rival.'
        }
        return 'Prepara tu estrategia. Esperando a que se unan todos los jugadores.'
    }, [allReady, isResume, normalizedGameMode, roomStatus])

    const streakLabel = normalizedGameMode === '1vs1' ? 'Racha ultimas 5 partidas' : 'Top ultimas 5 partidas'
    const boardImage = normalizedGameMode === '1vs1' ? boardImage1v1 : boardImage4Players

    return (
        <div className="waiting-room">
            <img className="waiting-room__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="waiting-room__overlay" aria-hidden="true"></div>

            <img className="waiting-room__question waiting-room__question--left" src={questionMarkImage} alt="" aria-hidden="true" />
            <img className="waiting-room__question waiting-room__question--right" src={questionMarkImage} alt="" aria-hidden="true" />

            <main className="waiting-room__layout">
                <img className="waiting-room__title-image" src={titleImage} alt="Sala de espera" />

                <section
                    className={`waiting-room__board waiting-room__board--${maxPlayers}`}
                    aria-label="Sala de espera"
                >
                    <img className="waiting-room__board-image" src={boardImage} alt="" aria-hidden="true" />

                    <div className="waiting-room__board-content">
                        <p className="waiting-room__status-pill">{statusText}</p>

                        <div className={`waiting-room__players waiting-room__players--${maxPlayers}`}>
                            {Array.from({ length: maxPlayers }).map((_, index) => {
                                const player = players[index]
                                const historyPreview = player
                                    ? (historyByPlayer[player.id] ?? EMPTY_HISTORY_PREVIEW)
                                    : EMPTY_HISTORY_PREVIEW
                                const isMe = !!player && (
                                    (myUserId !== null && player.id === myUserId) ||
                                    (myUsername && player.username === myUsername)
                                )

                                const cardClassName = [
                                    'waiting-player-card',
                                    player ? 'waiting-player-card--active' : 'waiting-player-card--empty',
                                    player?.is_ready ? 'waiting-player-card--ready' : '',
                                    isMe ? 'waiting-player-card--me' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')

                                return (
                                    <article className={cardClassName} key={index}>
                                        <div className="waiting-player-card__photo">
                                            {player ? (
                                                <img
                                                    className="waiting-player-card__avatar"
                                                    src={resolveUserAvatar(player.avatar_url, player.username)}
                                                    alt={`Avatar de ${player.username}`}
                                                />
                                            ) : (
                                                <img
                                                    className="waiting-player-card__avatar waiting-player-card__avatar--placeholder"
                                                    src={questionMarkImage}
                                                    alt="Hueco de jugador vacio"
                                                />
                                            )}

                                            {player?.is_ready && (
                                                <span className="waiting-player-card__ready-badge" aria-label="Jugador listo">
                                                    LISTO
                                                </span>
                                            )}
                                        </div>

                                        <span className="waiting-player-card__name" title={player?.username || 'Esperando jugador'}>
                                            {player ? player.username : 'Esperando...'}
                                        </span>

                                        <p className="waiting-player-card__rr">
                                            <span>ELO ACTUAL:</span>
                                            <strong>{player ? `${player.rr} RR` : '--- RR'}</strong>
                                        </p>

                                        <div
                                            className={`waiting-player-card__streak waiting-player-card__streak--slot-${index + 1}`}
                                            aria-label={streakLabel}
                                        >
                                            {historyPreview.map((result, resultIndex) => {
                                                const tokenImage = getHistoryTokenImage(result, resultIndex)
                                                if (!tokenImage) {
                                                    return (
                                                        <span
                                                            key={`${index}-empty-${resultIndex}`}
                                                            className="waiting-player-card__streak-empty"
                                                            aria-label="Sin dato"
                                                        >
                                                            -
                                                        </span>
                                                    )
                                                }

                                                return (
                                                    <img
                                                        key={`${index}-token-${resultIndex}`}
                                                        className="waiting-player-card__streak-token"
                                                        src={tokenImage}
                                                        alt={getHistoryTokenLabel(result)}
                                                        title={getHistoryTokenLabel(result)}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>

                        <p className="waiting-room__hint">{helperText}</p>
                        {toast && <p className="waiting-room__toast">{toast}</p>}
                    </div>
                </section>

                <div className="waiting-room__actions">
                    <button className="waiting-room__btn waiting-room__btn--leave" onClick={handleLeave}>
                        <img className="waiting-room__btn-image" src={leaveButtonImage} alt="" aria-hidden="true" />
                        <span className="waiting-room__btn-label">Abandonar sala</span>
                    </button>

                    <button
                        className={`waiting-room__btn waiting-room__btn--ready ${localPlayer?.is_ready ? 'waiting-room__btn--is-ready' : ''}`}
                        disabled={roomStatus === 'playing' || !localPlayer}
                        onClick={handleReady}
                    >
                        <img className="waiting-room__btn-image" src={readyButtonImage} alt="" aria-hidden="true" />
                        <span className="waiting-room__btn-label">{localPlayer?.is_ready ? 'Listo' : 'Estoy listo'}</span>
                    </button>
                </div>
            </main>
        </div>
    )
}

export default WaitingRoom
