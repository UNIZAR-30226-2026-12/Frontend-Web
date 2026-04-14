import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/Ranking.css'

interface RankingProps {
    onNavigate: (screen: string, data?: any) => void
}

interface RankingEntry {
    id: number
    username: string
    elo: number
    avatar_url?: string
}

function Ranking({ onNavigate }: RankingProps) {
    const [ranking, setRanking] = useState<RankingEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [myUserId, setMyUserId] = useState<number | null>(null)

    const fetchRanking = async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError('')

        try {
            const data = await api.ranking.getGlobal(100, 0)
            setRanking(data.ranking || [])
        } catch (err: any) {
            setError(err.message || 'No se pudo cargar el ranking global')
        } finally {
            if (refresh) {
                setIsRefreshing(false)
            } else {
                setIsLoading(false)
            }
        }
    }

    useEffect(() => {
        fetchRanking()
        api.users.getMe().then((me) => setMyUserId(me.id)).catch(() => setMyUserId(null))
    }, [])

    return (
        <div className="ranking">
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

            <div className="ranking__container">
                <header className="ranking__header">
                    <div>
                        <h1 className="ranking__title">Ranking Global</h1>
                        <p className="ranking__subtitle">Top de jugadores ordenados por ELO (RR)</p>
                    </div>
                    <button
                        className="ranking__refresh-btn"
                        onClick={() => fetchRanking(true)}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </header>

                {isLoading ? (
                    <p className="ranking__state">Cargando ranking...</p>
                ) : error ? (
                    <p className="ranking__state ranking__state--error">{error}</p>
                ) : ranking.length === 0 ? (
                    <p className="ranking__state">No hay jugadores para mostrar.</p>
                ) : (
                    <div className="ranking__list">
                        {ranking.map((entry, index) => (
                            <button
                                key={entry.id}
                                className={`ranking__row ${entry.id === myUserId ? 'ranking__row--me' : ''}`}
                                onClick={() => onNavigate('profile', { id: entry.id, name: entry.username, returnTo: 'ranking' })}
                                type="button"
                            >
                                <span className="ranking__position">#{index + 1}</span>
                                <img
                                    className="ranking__avatar"
                                    src={resolveUserAvatar(entry.avatar_url, entry.username)}
                                    alt={`Avatar de ${entry.username}`}
                                />
                                <span className="ranking__name">{entry.username}</span>
                                <span className="ranking__elo">{entry.elo} RR</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button className="ranking__back-btn" onClick={() => onNavigate('menu')}>
                Volver al menu
            </button>
        </div>
    )
}

export default Ranking
