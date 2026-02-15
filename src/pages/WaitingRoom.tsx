import { useState, useEffect } from 'react'
import { getAvatarFromSeed } from '../assets/avatarUtils'
import '../Background.css'
import './WaitingRoom.css'

interface Player {
    id: number
    name: string
    rr: number
    isReady: boolean
}

interface WaitingRoomProps {
    gameMode: '1vs1' | '1vs1vs1vs1'
    returnScreen: string
    onNavigate: (screen: string, data?: any) => void
}

function WaitingRoom({ gameMode, returnScreen, onNavigate }: WaitingRoomProps) {
    const maxPlayers = gameMode === '1vs1' ? 2 : 4
    const [players, setPlayers] = useState<Player[]>([
        { id: 1, name: 'Tu', rr: 1250, isReady: false }
    ])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (players.length < maxPlayers) {
                setPlayers(prev => [
                    ...prev,
                    { id: 2, name: 'Gamer_Pro', rr: 1420, isReady: true }
                ])
            }
        }, 3000)

        return () => window.clearTimeout(timer)
    }, [maxPlayers, players.length])

    const handleReady = () => {
        setPlayers(prev => prev.map(player => (
            player.name === 'Tu' ? { ...player, isReady: !player.isReady } : player
        )))
    }

    const isFull = players.length === maxPlayers
    const allReady = isFull && players.every(player => player.isReady)

    useEffect(() => {
        if (!allReady) return

        const timer = window.setTimeout(() => {
            if (gameMode === '1vs1') {
                onNavigate('game-1vs1')
            }
        }, 900)

        return () => window.clearTimeout(timer)
    }, [allReady, gameMode, onNavigate])

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
                                            src={getAvatarFromSeed(player.name)}
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
                        className={`waiting-room__btn waiting-room__btn--ready ${players.find(player => player.name === 'Tu')?.isReady ? 'waiting-room__btn--is-ready' : ''}`}
                        disabled={!isFull}
                        onClick={handleReady}
                    >
                        {players.find(player => player.name === 'Tu')?.isReady ? 'Listo' : 'Estoy Listo'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WaitingRoom
