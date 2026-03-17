import { useState, useEffect } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/OnlineGame.css'

interface OnlineGameProps {
    onNavigate: (screen: string, data?: any) => void
}

interface GameSession {
    id: number
    creator: string
    avatar_url?: string
    creatorRR: number
    mode: '1vs1' | '1vs1vs1vs1'
    players: number
    maxPlayers: number
    status: 'waiting' | 'full'
}

interface GameHistory {
    id: number
    date: string
    mode: string
    result: 'Ganada' | 'Perdida' | 'Empate'
    score: string
    rankChange: string
}

const MOCK_PUBLIC_GAMES: GameSession[] = [
    { id: 1, creator: 'CyberNinja', creatorRR: 1420, mode: '1vs1', players: 1, maxPlayers: 2, status: 'waiting' },
    { id: 2, creator: 'ReversiExpert', creatorRR: 1850, mode: '1vs1vs1vs1', players: 3, maxPlayers: 4, status: 'waiting' },
    { id: 3, creator: 'StarPlayer99', creatorRR: 1200, mode: '1vs1', players: 2, maxPlayers: 2, status: 'full' },
    { id: 4, creator: 'DarkMaster', creatorRR: 1680, mode: '1vs1', players: 1, maxPlayers: 2, status: 'waiting' },
    { id: 5, creator: 'LighSaber', creatorRR: 1350, mode: '1vs1vs1vs1', players: 2, maxPlayers: 4, status: 'waiting' },
    { id: 6, creator: 'GhostRider', creatorRR: 1550, mode: '1vs1', players: 1, maxPlayers: 2, status: 'waiting' },
    { id: 7, creator: 'PixelArt', creatorRR: 1100, mode: '1vs1vs1vs1', players: 1, maxPlayers: 4, status: 'waiting' },
    { id: 8, creator: 'RedDragon', creatorRR: 1920, mode: '1vs1', players: 1, maxPlayers: 2, status: 'waiting' },
    { id: 9, creator: 'BlueWave', creatorRR: 1480, mode: '1vs1', players: 1, maxPlayers: 2, status: 'waiting' },
    { id: 10, creator: 'GreenLeaf', creatorRR: 1320, mode: '1vs1vs1vs1', players: 3, maxPlayers: 4, status: 'waiting' },
]


function OnlineGame({ onNavigate }: OnlineGameProps) {
    const [user, setUser] = useState<any>(null)
    const [publicGames, setPublicGames] = useState<GameSession[]>(MOCK_PUBLIC_GAMES)
    const [history, setHistory] = useState<GameHistory[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await api.users.getMe()
                setUser(userData)

                const historyData = await api.users.getHistory()
                setHistory(historyData)
            } catch (err) {
                console.error('Error fetching online game data', err)
            }
        }
        fetchData()
    }, [])

    const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        setTimeout(() => {
            setIsRefreshing(false)
            showToast('Lista de partidas actualizada', 'info')
        }, 1000)
    }

    const handleCreateGame = (mode: string) => {
        const newGame: GameSession = {
            id: Date.now(),
            creator: user?.username || 'Tú',
            creatorRR: user?.elo || 0,
            mode: mode as '1vs1' | '1vs1vs1vs1',
            players: 1,
            maxPlayers: mode === '1vs1' ? 2 : 4,
            status: 'waiting'
        }
        setPublicGames([newGame, ...publicGames])
        setShowCreateModal(false)
        onNavigate('waiting-room', {
            mode,
            playerName: user?.username || 'Jugador',
            playerRR: user?.elo || 0,
            opponentName: 'Gamer_Pro',
            opponentRR: 1420,
        })
    }

    return (
        <div className="online">

            {/* Fondo animado compartido */}
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

            <div className="online__container">
                <header className="online__header">
                    <div className="online__header-left">
                        <h1 className="online__title">Jugar Online</h1>
                        <p className="online__subtitle">Compite contra jugadores de todo el mundo</p>
                    </div>
                    <div className="online__header-actions">
                        <button className="online__btn online__btn--refresh" onClick={handleRefresh} disabled={isRefreshing}>
                            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                        </button>
                        <button className="online__btn online__btn--create" onClick={() => setShowCreateModal(true)}>
                            Crear Partida
                        </button>
                    </div>
                </header>

                <div className="online__content">
                    {/* Sección: Partidas Públicas */}
                    <div className="online__section online__public-section">
                        <h2 className="online__section-title">Partidas Públicas</h2>
                        <div className="online__games-list">
                            {publicGames
                                .filter(game => game.status !== 'full')
                                .map(game => (
                                    <div key={game.id} className={`game-card game-card--${game.status}`}>
                                        <div className="game-card__info">
                                            <div className="game-card__creator-info">
                                                <img
                                                    className="game-card__creator-avatar"
                                                    src={resolveUserAvatar(game.avatar_url, game.creator)}
                                                    alt={`Avatar de ${game.creator}`}
                                                />
                                                <div className="game-card__creator-details">
                                                    <span className="game-card__creator-name">{game.creator}</span>
                                                    <span className="game-card__mode-tag">{game.mode}</span>
                                                </div>
                                            </div>
                                            <div className="game-card__stats">
                                                <span className="game-card__creator-rr">{game.creatorRR} RR</span>
                                                <span className="game-card__players-count">👥 {game.players}/{game.maxPlayers}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="game-card__join-btn"
                                            disabled={game.status === 'full'}
                                            onClick={() =>
                                                onNavigate('waiting-room', {
                                                    mode: game.mode,
                                                    playerName: user?.username || 'Jugador',
                                                    playerRR: user?.elo || 0,
                                                    opponentName: game.creator,
                                                    opponentRR: game.creatorRR,
                                                })
                                            }
                                        >
                                            {game.status === 'full' ? 'Llena' : 'Unirse'}
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Sección: Historial */}
                    <div className="online__section online__history-section">
                        <div className="online__rr-card">
                            <span className="online__rr-card-label">ELO actual:</span>
                            <span className="online__rr-card-value">{user?.elo || 0} RR</span>
                        </div>

                        <h2 className="online__section-title">Tu Historial</h2>
                        <div className="online__history-list">
                            {history.length === 0 ? (
                                <p className="online__empty">No has jugado partidas todavia.</p>
                            ) : (
                                history.map(item => (
                                    <div key={item.id} className={`history-card history-card--${item.result.toLowerCase()}`}>
                                        <div className="history-card__header">
                                            <span className={`history-card__result history-card__result--${item.result.toLowerCase()}`}>
                                                {item.result}
                                            </span>
                                            <span className="history-card__date">{item.date}</span>
                                        </div>
                                        <div className="history-card__body">
                                            <span className="history-card__mode">{item.mode}</span>
                                            <span className="history-card__score">{item.score}</span>
                                            <span className="history-card__rank">{item.rankChange}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <button className="online__back-btn" onClick={() => onNavigate('menu')}>
                Volver al menú
            </button>

            {/* Notificación crear partida */}
            <div className={`toast toast--${toast.type} ${toast.visible ? 'toast--visible' : ''}`}>
                <span className="toast__icon">
                    {toast.type === 'success' && '✅'}
                    {toast.type === 'info' && '🔔'}
                    {toast.type === 'error' && '❌'}
                </span>
                <span className="toast__message">{toast.message}</span>
            </div>

            <GameModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Crear nueva partida"
                subtitle="Elige el modo para tu sala pública"
                onSelectMode={handleCreateGame}
            />
        </div>
    )
}

export default OnlineGame

