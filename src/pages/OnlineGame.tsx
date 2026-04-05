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
    game_id: string
    creator: string
    avatar_url?: string
    creator_rr: number
    mode: '1vs1' | '1vs1vs1vs1' | '1v1' | '1v1v1v1'
    players: number
    max_players: number
    status: 'waiting' | 'playing' | 'full'
}

interface GameHistory {
    id: number
    date: string
    mode: string
    result: 'Ganada' | 'Perdida' | 'Empate' | '1º' | '2º' | '3º' | '4º'
    score: string
    rankChange: string
}

const normalizeOrdinal = (value: string) =>
    value.replace('Âº', 'º').trim()

const getHistoryTone = (entry: GameHistory): 'win' | 'loss' | 'draw' => {
    const mode = entry.mode === '1v1v1v1' ? '1vs1vs1vs1' : entry.mode
    const normalizedResult = normalizeOrdinal(entry.result)

    if (mode === '1vs1vs1vs1') {
        if (normalizedResult === '1º') return 'win'
        if (normalizedResult === '4º') return 'loss'
        return 'draw'
    }

    if (normalizedResult === 'Ganada') return 'win'
    if (normalizedResult === 'Perdida') return 'loss'
    return 'draw'
}




function OnlineGame({ onNavigate }: OnlineGameProps) {
    const [user, setUser] = useState<any>(null)
    const [publicGames, setPublicGames] = useState<GameSession[]>([])
    const [history, setHistory] = useState<GameHistory[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false
    })

    const fetchPublicGames = async () => {
        try {
            const data = await api.games.getPublic()
            setPublicGames(data.lobbies || [])
        } catch (err) {
            console.error('Error fetching public games', err)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await api.users.getMe()
                setUser(userData)

                const historyData = await api.users.getHistory()
                setHistory(historyData)
                
                await fetchPublicGames()
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

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await fetchPublicGames()
            showToast('Lista de partidas actualizada', 'info')
        } catch (err) {
            showToast('Error al actualizar partidas', 'error')
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleJoinGame = async (game: GameSession) => {
        try {
            await api.games.join(game.game_id)
            onNavigate('waiting-room', {
                gameId: game.game_id,
                mode: game.mode,
                creator: game.creator,
                returnTo: 'online-game'
            })
        } catch (err: any) {
            showToast(err.message || 'Error al unirse a la partida', 'error')
        }
    }

    const handleCreateGame = async (mode: string) => {
        try {
            const res = await api.games.create(mode)
            setShowCreateModal(false)
            onNavigate('waiting-room', {
                gameId: res.game_id,
                mode: mode,
                creator: user?.username || 'Yo',
                returnTo: 'online-game'
            })
        } catch (err: any) {
            showToast(err.message || 'Error al crear partida', 'error')
        }
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
                                    <div key={game.game_id} className={`game-card game-card--${game.status}`}>
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
                                                <span className="game-card__creator-rr">{game.creator_rr} RR</span>
                                                <span className="game-card__players-count">👥 {game.players}/{game.max_players}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="game-card__join-btn"
                                            disabled={game.status === 'full' || game.status === 'playing'}
                                            onClick={() => handleJoinGame(game)}
                                        >
                                            {game.status === 'full' ? 'Llena' : game.status === 'playing' ? 'En curso' : 'Unirse'}
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
                                    <div key={item.id} className={`history-card history-card--${getHistoryTone(item)}`}>
                                        <div className="history-card__header">
                                            <span className={`history-card__result history-card__result--${getHistoryTone(item)}`}>
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

