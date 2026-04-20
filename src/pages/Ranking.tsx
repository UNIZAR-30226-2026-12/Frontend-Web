import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import rankingTitle from '../assets/ranking/rankingGlobal.png'
import rankingSheet from '../assets/ranking/libretaRanking.png'
import trophyIcon from '../assets/ranking/Trofeo.png'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import questionMark from '../assets/elementosGenerales/interrogante.png'
import backToMenuButtonImage from '../assets/elementosGenerales/botonVolverMenu.png'
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

interface CurrentUser {
    id: number
}

function Ranking({ onNavigate }: RankingProps) {
    const [ranking, setRanking] = useState<RankingEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [myUser, setMyUser] = useState<CurrentUser | null>(null)

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
        api.users.getMe()
            .then((me) => setMyUser({ id: me.id }))
            .catch(() => setMyUser(null))
    }, [])

    const myUserId = myUser?.id ?? null

    return (
        <div className="ranking">
            <img className="ranking__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="ranking__overlay" aria-hidden="true"></div>

            <div className="ranking__question-layer" aria-hidden="true">
                <img className="ranking__question ranking__question--1" src={questionMark} alt="" />
                <img className="ranking__question ranking__question--2" src={questionMark} alt="" />
                <img className="ranking__question ranking__question--3" src={questionMark} alt="" />
                <img className="ranking__question ranking__question--4" src={questionMark} alt="" />
            </div>

            <main className="ranking__stage">
                <header className="ranking__header">
                    <img className="ranking__title-image" src={rankingTitle} alt="Ranking global" />
                    <button
                        className="ranking__refresh-btn"
                        onClick={() => fetchRanking(true)}
                        disabled={isRefreshing}
                        type="button"
                    >
                        {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </header>

                <section className="ranking__sheet">
                    <img className="ranking__sheet-bg" src={rankingSheet} alt="" aria-hidden="true" />

                    {isLoading ? (
                        <p className="ranking__state">Cargando ranking...</p>
                    ) : error ? (
                        <p className="ranking__state ranking__state--error">{error}</p>
                    ) : ranking.length === 0 ? (
                        <p className="ranking__state">No hay jugadores para mostrar.</p>
                    ) : (
                        <div className="ranking__table">
                            {ranking.map((entry, index) => (
                                <button
                                    key={entry.id}
                                    className={`ranking__row ${entry.id === myUserId ? 'ranking__row--me' : ''}`}
                                    onClick={() => onNavigate('profile', { id: entry.id, name: entry.username, returnTo: 'ranking' })}
                                    type="button"
                                    title={`Ver perfil de ${entry.username}`}
                                >
                                    <span className={`ranking__position ${index === 0 ? 'ranking__position--champion' : ''}`}>
                                        {index === 0 && (
                                            <img className="ranking__trophy" src={trophyIcon} alt="" aria-hidden="true" />
                                        )}
                                        <span>{index + 1}</span>
                                    </span>

                                    <span className="ranking__player">
                                        <img
                                            className="ranking__avatar"
                                            src={resolveUserAvatar(entry.avatar_url, entry.username)}
                                            alt={`Avatar de ${entry.username}`}
                                        />
                                        <span className="ranking__name">{entry.username}</span>
                                    </span>

                                    <span className="ranking__elo">{entry.elo} RR</span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <button className="ranking__back-btn" onClick={() => onNavigate('menu')} type="button" aria-label="Volver al menu">
                    <img src={backToMenuButtonImage} alt="" />
                </button>
            </main>
        </div>
    )
}

export default Ranking
