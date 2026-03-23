import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/Profile.css'

interface ProfileProps {
    onNavigate: (screen: string, data?: any) => void
    userId?: number
    username?: string
}

interface Stats {
    username: string
    elo: number
    avatar_url?: string
    total_games: number
    wins: number
    losses: number
    draws: number
    winrate: number
}

interface H2H {
    total_matches: number
    wins: number
    losses: number
    draws: number
}

interface GameEntry {
    id: number
    result: 'Ganada' | 'Perdida' | 'Empate'
    opponent_name: string
    mode: string
    score: string
    rank_change?: string
    rankChange?: string
    created_at?: string
    date?: string
}

function getResultColor(result: string) {
    if (result === 'Ganada') return '#4ade80'
    if (result === 'Perdida') return '#f87171'
    return '#fbbf24'
}

function getWinRateSegments(winrate: number) {
    const clamped = Math.max(0, Math.min(100, winrate))
    return clamped
}

function Profile({ onNavigate, userId, username }: ProfileProps) {
    const [stats, setStats] = useState<Stats | null>(null)
    const [h2h, setH2h] = useState<H2H | null>(null)
    const [history, setHistory] = useState<GameEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true)
            setError('')
            try {
                const targetId = userId || 'me'
                const data = await api.users.getStats(targetId as any)
                setStats(data)

                if (userId) {
                    try {
                        const h2hData = await api.users.getH2H(userId)
                        setH2h(h2hData)
                    } catch {
                        setH2h(null)
                    }
                }

                const historyData = await api.users.getHistory(targetId as any)
                setHistory(Array.isArray(historyData) ? historyData : [])
            } catch {
                setError('No se pudo cargar el perfil.')
            } finally {
                setLoading(false)
            }
        }
        fetchProfileData()
    }, [userId])

    const displayName = username || stats?.username || 'Usuario'
    const winRate = stats?.winrate ?? 0

    return (
        <div className="profile">
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

            <div className="profile__container">
                {/* ── CABECERA ── */}
                <header className="profile__header">
                    <div className="profile__hero">
                        <img
                            className="profile__avatar"
                            src={resolveUserAvatar(stats?.avatar_url, displayName)}
                            alt={`Avatar de ${displayName}`}
                        />
                        <div className="profile__hero-info">
                            <h1 className="profile__name">{displayName}</h1>
                            <div className="profile__elo-badge">
                                <span className="profile__elo-icon">🏆</span>
                                <span className="profile__elo-value">{stats?.elo ?? 1000} RR</span>
                            </div>
                        </div>
                    </div>
                    <p className="profile__subtitle">Estadísticas e historial de partidas</p>
                </header>

                {loading ? (
                    <div className="profile__loading">
                        <div className="profile__spinner" />
                        <span>Cargando datos...</span>
                    </div>
                ) : error ? (
                    <div className="profile__error">{error}</div>
                ) : (
                    <div className="profile__body">
                        {/* ── COLUMNA IZQUIERDA ── */}
                        <div className="profile__sidebar">

                            {/* Win rate visual */}
                            <div className="profile__card profile__card--winrate">
                                <h3 className="profile__card-title">Win Rate</h3>
                                <div className="profile__winrate-circle">
                                    <svg viewBox="0 0 80 80" className="profile__winrate-svg">
                                        <circle cx="40" cy="40" r="32" className="profile__winrate-track" />
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="32"
                                            className="profile__winrate-fill"
                                            strokeDasharray={`${getWinRateSegments(winRate) * 2.0106} 200`}
                                        />
                                    </svg>
                                    <span className="profile__winrate-label">{winRate}%</span>
                                </div>
                                <div className="profile__winrate-legend">
                                    <span className="profile__legend-dot profile__legend-dot--win" />
                                    <span>Victorias</span>
                                    <span className="profile__legend-dot profile__legend-dot--loss" />
                                    <span>Derrotas</span>
                                </div>
                            </div>

                            {/* Estadísticas globales */}
                            <div className="profile__card">
                                <h3 className="profile__card-title">Estadísticas Globales</h3>
                                <ul className="profile__stat-list">
                                    <li className="profile__stat-row">
                                        <span className="profile__stat-label">Partidas jugadas</span>
                                        <strong className="profile__stat-val">{stats?.total_games ?? 0}</strong>
                                    </li>
                                    <li className="profile__stat-row">
                                        <span className="profile__stat-label profile__stat-label--win">Victorias</span>
                                        <strong className="profile__stat-val profile__stat-val--win">{stats?.wins ?? 0}</strong>
                                    </li>
                                    <li className="profile__stat-row">
                                        <span className="profile__stat-label profile__stat-label--loss">Derrotas</span>
                                        <strong className="profile__stat-val profile__stat-val--loss">{stats?.losses ?? 0}</strong>
                                    </li>
                                    <li className="profile__stat-row profile__stat-row--last">
                                        <span className="profile__stat-label profile__stat-label--draw">Empates</span>
                                        <strong className="profile__stat-val profile__stat-val--draw">{stats?.draws ?? 0}</strong>
                                    </li>
                                </ul>
                            </div>

                            {/* Cara a cara (solo perfil de amigo) */}
                            {userId && (
                                <div className="profile__card profile__card--h2h">
                                    <h3 className="profile__card-title">
                                        <span className="profile__h2h-icon">⚔️</span>
                                        Cara a Cara
                                    </h3>
                                    {h2h ? (
                                        <ul className="profile__stat-list">
                                            <li className="profile__stat-row">
                                                <span className="profile__stat-label">Partidas</span>
                                                <strong className="profile__stat-val">{h2h.total_matches}</strong>
                                            </li>
                                            <li className="profile__stat-row">
                                                <span className="profile__stat-label profile__stat-label--win">Tus victorias</span>
                                                <strong className="profile__stat-val profile__stat-val--win">{h2h.wins}</strong>
                                            </li>
                                            <li className="profile__stat-row">
                                                <span className="profile__stat-label profile__stat-label--loss">Tus derrotas</span>
                                                <strong className="profile__stat-val profile__stat-val--loss">{h2h.losses}</strong>
                                            </li>
                                            <li className="profile__stat-row profile__stat-row--last">
                                                <span className="profile__stat-label profile__stat-label--draw">Empates</span>
                                                <strong className="profile__stat-val profile__stat-val--draw">{h2h.draws}</strong>
                                            </li>
                                        </ul>
                                    ) : (
                                        <p className="profile__empty">Sin enfrentamientos previos.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── COLUMNA DERECHA: HISTORIAL ── */}
                        <div className="profile__card profile__card--history">
                            <h3 className="profile__card-title">Últimas Partidas</h3>
                            <div className="profile__history-list">
                                {history.length === 0 ? (
                                    <div className="profile__empty profile__empty--centered">
                                        <span className="profile__empty-icon">🎮</span>
                                        <span>No hay partidas recientes.</span>
                                    </div>
                                ) : (
                                    history.map((game) => {
                                        const resultColor = getResultColor(game.result)
                                        const rankChange = game.rank_change ?? game.rankChange ?? '0 RR'
                                        const date = game.date ?? (game.created_at ? game.created_at.slice(0, 10) : '')
                                        return (
                                            <div
                                                key={game.id}
                                                className="profile__game-entry"
                                                style={{ '--result-color': resultColor } as React.CSSProperties}
                                            >
                                                <div className="profile__game-result-stripe" />
                                                <div className="profile__game-left">
                                                    <span className="profile__game-result" style={{ color: resultColor }}>
                                                        {game.result.toUpperCase()}
                                                    </span>
                                                    <span className="profile__game-opponent">
                                                        vs {game.opponent_name || 'Alguien'}
                                                    </span>
                                                    <div className="profile__game-meta">
                                                        {date && <span className="profile__game-date">{date}</span>}
                                                        <span className="profile__game-mode-tag">{game.mode}</span>
                                                    </div>
                                                </div>
                                                <div className="profile__game-right">
                                                    <span className="profile__game-rr">{rankChange}</span>
                                                    <span className="profile__game-score">
                                                        <span className="profile__game-score-label">Fichas</span>
                                                        {game.score}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className="profile__back-btn"
                    onClick={() => onNavigate(userId ? 'friends' : 'menu')}
                >
                    {userId ? 'Volver a amigos' : 'Volver al menú'}
                </button>
            </div>
        </div>
    )
}

export default Profile