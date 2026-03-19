import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/WaitingRoom.css'

interface Player {
    id: number
    name: string
    rr: number
    isReady: boolean
}

interface GameHistory {
    id: number
    date: string
    mode: string
    result: 'Ganada' | 'Perdida' | 'Empate'
    score: string
    rankChange: string
}

interface WaitingRoomProps {
    gameMode: '1vs1' | '1vs1vs1vs1'
    returnScreen: string
    playerName?: string
    playerRR?: number
    opponentName?: string
    opponentRR?: number
    opponentName2?: string
    opponentRR2?: number
    opponentName3?: string
    opponentRR3?: number
    onNavigate: (screen: string, data?: any) => void
}

type MatchResult = 'W' | 'L'
type HistoryPreviewSymbol = 'V' | 'D' | 'E' | '-'

const SIMULATED_STREAKS: Record<string, MatchResult[]> = {
    Tu: ['W', 'L', 'W', 'W', 'L'],
    Gamer_Pro: ['L', 'W', 'L', 'L', 'W'],
    Rival: ['W', 'W', 'L', 'W', 'L']
}

const EMPTY_HISTORY_PREVIEW: HistoryPreviewSymbol[] = ['-', '-', '-', '-', '-']

const buildHistoryPreview = (history: GameHistory[]): HistoryPreviewSymbol[] => {
    const recentSymbols = history
        .slice(0, 5)
        .map((item): HistoryPreviewSymbol => {
            if (item.result === 'Ganada') return 'V'
            if (item.result === 'Perdida') return 'D'
            return 'E'
        })

    const symbols = [...recentSymbols].reverse()

    while (symbols.length < 5) {
        symbols.unshift('-')
    }

    return symbols
}

function WaitingRoom({
    gameMode,
    returnScreen,
    playerName,
    playerRR,
    opponentName,
    opponentRR,
    opponentName2,
    opponentRR2,
    opponentName3,
    opponentRR3,
    onNavigate,
}: WaitingRoomProps) {
    const maxPlayers = gameMode === '1vs1' ? 2 : 4
    const localPlayerName = playerName ?? 'Tu'
    const localPlayerRR = playerRR ?? 2250
    const simulatedOpponentName = opponentName ?? 'Gamer_Pro'
    const simulatedOpponentRR = opponentRR ?? 1420
    const simulatedOpponentName2 = opponentName2 ?? 'Gamer_Pro2'
    const simulatedOpponentRR2 = opponentRR2 ?? 1680
    const simulatedOpponentName3 = opponentName3 ?? 'Gamer_Pro3'
    const simulatedOpponentRR3 = opponentRR3 ?? 1550

    const [players, setPlayers] = useState<Player[]>([
        { id: 1, name: localPlayerName, rr: localPlayerRR, isReady: false }
    ])
    const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined)
    const [playerHistoryPreview, setPlayerHistoryPreview] = useState<HistoryPreviewSymbol[]>(EMPTY_HISTORY_PREVIEW)

    useEffect(() => {
        let isMounted = true
        const fetchMe = async () => {
            try {
                const [me, history] = await Promise.all([
                    api.users.getMe(),
                    api.users.getHistory(),
                ])
                if (!isMounted) return
                setCurrentUserAvatar(me.avatar_url)
                setPlayerHistoryPreview(buildHistoryPreview(history))
            } catch {
                if (!isMounted) return
                setCurrentUserAvatar(undefined)
                setPlayerHistoryPreview(EMPTY_HISTORY_PREVIEW)
            }
        }
        fetchMe()
        return () => { isMounted = false }
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (players.length < maxPlayers) {
                if (gameMode === '1vs1') {
                    setPlayers(prev => [
                        ...prev,
                        { id: 2, name: simulatedOpponentName, rr: simulatedOpponentRR, isReady: true }
                    ])
                } else {
                    // Modo 1vs1vs1vs1: necesario añadir a los 3 jugadores necesarios 
                    setPlayers(prev => [
                        ...prev,
                        { id: 2, name: simulatedOpponentName, rr: simulatedOpponentRR, isReady: true },
                        { id: 3, name: simulatedOpponentName2, rr: simulatedOpponentRR2, isReady: true },
                        { id: 4, name: simulatedOpponentName3, rr: simulatedOpponentRR3, isReady: true }
                    ])
                }
            }
        }, 3000)

        return () => window.clearTimeout(timer)
    }, [maxPlayers, players.length, gameMode, simulatedOpponentName, simulatedOpponentRR, simulatedOpponentName2, simulatedOpponentRR2, simulatedOpponentName3, simulatedOpponentRR3])

    const handleReady = () => {
        setPlayers(prev => prev.map(player => (
            player.name === localPlayerName ? { ...player, isReady: !player.isReady } : player
        )))
    }

    const isFull = players.length === maxPlayers
    const allReady = isFull && players.every(player => player.isReady)

    const getSimulatedStreak = (playerName?: string): MatchResult[] => {
        if (!playerName) return SIMULATED_STREAKS.Rival
        return SIMULATED_STREAKS[playerName] ?? SIMULATED_STREAKS.Rival
    }

    const getPreviewHistory = (playerName: string): HistoryPreviewSymbol[] => {
        if (playerName === localPlayerName) {
            return playerHistoryPreview
        }

        return [...getSimulatedStreak(playerName).map(result => (result === 'W' ? 'V' : 'D'))].reverse()
    }

    useEffect(() => {
        if (!allReady) return

        const timer = window.setTimeout(() => {
            if (gameMode === '1vs1') {
                const localPlayer = players.find(player => player.name === localPlayerName)
                const rival = players.find(player => player.name !== localPlayerName)
                onNavigate('game-1vs1', {
                    matchData: {
                        playerName: localPlayer?.name ?? localPlayerName,
                        playerRR: localPlayer?.rr ?? localPlayerRR,
                        opponentName: rival?.name ?? simulatedOpponentName,
                        opponentRR: rival?.rr ?? simulatedOpponentRR,
                    },
                })
            } else {
                // Modo 1vs1vs1vs1: navegar a game-1v1v1v1
                onNavigate('game-1v1v1v1', {
                    matchData: {
                        players: players.map(p => ({ name: p.name, rr: p.rr }))
                    }
                })
            }
        }, 900)

        return () => window.clearTimeout(timer)
    }, [allReady, gameMode, localPlayerName, localPlayerRR, onNavigate, players, simulatedOpponentName, simulatedOpponentRR])

    return (
        <div className="waiting-room">
            <div className="home__bg">
                <span className="home__chip home__chip--1">⚫</span>
                <span className="home__chip home__chip--2">⚪</span>
                <span className="home__chip home__chip--3">🔴</span>
                <span className="home__chip home__chip--4">🔵</span>
                <span className="home__chip home__chip--5">🟢</span>
                <span className="home__chip home__chip--6">🟡</span>
                <span className="home__chip home__chip--7">🟣</span>
                <span className="home__chip home__chip--8">🟠</span>
                <span className="home__chip home__chip--9">⚫</span>
                <span className="home__chip home__chip--10">⚪</span>
                <span className="home__chip home__chip--q1 home__chip--question">❓</span>
                <span className="home__chip home__chip--q2 home__chip--question">❓</span>
                <span className="home__chip home__chip--q3 home__chip--question">❓</span>
                <span className="home__chip home__chip--q4 home__chip--question">❓</span>
            </div>

            <div className="waiting-room__container">
                <header className="waiting-room__header">
                    <h1 className="waiting-room__title">Sala de Espera</h1>
                    <span className="waiting-room__mode-tag">{gameMode}</span>
                </header>

                <div className="waiting-room__animation">
                    <div className="waiting-room__chip-3d"></div>
                </div>

                <p className="waiting-room__loading-text">
                    {allReady ? 'INICIANDO PARTIDA...' : isFull ? 'SALA LLENA' : 'ESPERANDO JUGADORES...'}
                </p>

                <div className="waiting-room__players">
                    {Array.from({ length: maxPlayers }).map((_, index) => {
                        const player = players[index]

                        return (
                            <div
                                key={index}
                                className={`player-slot ${player ? 'player-slot--active' : 'player-slot--empty'} ${player?.isReady ? 'player-slot--ready' : ''}`}
                            >
                                <div className="player-slot__avatar">
                                    {player ? (
                                        <img
                                            className="player-slot__avatar-img"
                                            src={resolveUserAvatar(player.name === localPlayerName ? currentUserAvatar : undefined, player.name)}
                                            alt={`Avatar de ${player.name}`}
                                        />
                                    ) : '?'}

                                    {player?.isReady && (
                                        <div className="player-slot__ready-badge">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div className="player-slot__details">
                                    <span className="player-slot__name">
                                        {player ? player.name : 'Esperando...'}
                                    </span>
                                    {player && gameMode === '1vs1' && (
                                        <span className="player-slot__streak" aria-label="Racha últimas 5 partidas">
                                            {getPreviewHistory(player.name).map((result, resultIndex) => (
                                                <span
                                                    key={`${player.id}-streak-${resultIndex}`}
                                                    className={`player-slot__streak-item ${result === 'V' ? 'player-slot__streak-item--win' : result === 'D' ? 'player-slot__streak-item--loss' : 'player-slot__streak-item--empty'}`}
                                                >
                                                    {result}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                    {player && (
                                        <span className="player-slot__rr">{player.rr} RR</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="waiting-room__actions">
                    <button
                        className="waiting-room__btn waiting-room__btn--leave"
                        onClick={() => onNavigate(returnScreen)}
                    >
                        Abandonar Sala
                    </button>
                    <button
                        className={`waiting-room__btn waiting-room__btn--ready ${players.find(player => player.name === localPlayerName)?.isReady ? 'waiting-room__btn--is-ready' : ''}`}
                        disabled={!isFull}
                        onClick={handleReady}
                    >
                        {players.find(player => player.name === localPlayerName)?.isReady ? 'Listo' : 'Estoy Listo'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WaitingRoom
