import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import { resolveUserAvatar } from '../config/avatarOptions'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import backToMenuButtonImage from '../assets/elementosGenerales/botonVolverMenu.png'
import titleImage from '../assets/jugarOnline/tituloJugarOnline.png'
import corkBoardImage from '../assets/jugarOnline/tableroCorcho.png'
import statusImage from '../assets/jugarOnline/estatus.png'
import publicationImage from '../assets/jugarOnline/publicacionPartida.png'
import createButtonImage from '../assets/jugarOnline/crearPartida.png'
import refreshButtonImage from '../assets/jugarOnline/actualizar.png'
import joinButtonImage from '../assets/jugarOnline/botonUnirse.png'
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
    id?: number | string
    date: string
    mode: string
    result: string
    score?: string
    rankChange?: string
}

type HistoryTone = 'win' | 'loss' | 'neutral'

const PUBLICATION_SLOTS = [
    { top: '22%', left: '28%', rotate: -5 },
    { top: '24%', left: '60%', rotate: 4 },
    { top: '45%', left: '43%', rotate: -3 },
    { top: '68%', left: '28%', rotate: -4 },
    { top: '68%', left: '60%', rotate: 3 },
    { top: '45%', left: '75%', rotate: -5 },
    { top: '56%', left: '74%', rotate: 4 },
    { top: '33%', left: '24%', rotate: 3 },
]

const normalizeMode = (mode: string): '1vs1' | '1vs1vs1vs1' => {
    const cleanedMode = String(mode || '').toLowerCase()
    if (cleanedMode.includes('vs1vs1') || cleanedMode.includes('v1v1')) return '1vs1vs1vs1'
    if (cleanedMode.startsWith('1v1') || cleanedMode.startsWith('1vs1')) return '1vs1'
    return '1vs1vs1vs1'
}

const normalizeLobbyStatus = (status: string): 'waiting' | 'playing' | 'full' => {
    const cleanedStatus = String(status || '').toLowerCase()
    if (cleanedStatus === 'full') return 'full'
    if (cleanedStatus === 'playing') return 'playing'
    return 'waiting'
}

const formatLobbyMode = (mode: string) => (normalizeMode(mode) === '1vs1' ? '1V1' : '1V1V1V1')
const formatHistoryMode = (mode: string) => (normalizeMode(mode) === '1vs1' ? '1v1' : '1v1v1v1')

const normalizeHistoryText = (value: string) =>
    String(value || '')
        .replace(/Â/g, '')
        .replace(/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡/g, '')
        .replace(/ÃƒÆ’Ã¢â‚¬Å¡/g, '')
        .replace(/Ãƒâ€š/g, '')
        .trim()

const normalizeResult = (result: string) => normalizeHistoryText(result)

const extractPlacement = (value: string): number | null => {
    const normalized = normalizeHistoryText(value).toLowerCase()

    if (normalized.includes('1º') || normalized.includes('1o') || normalized.includes('1er') || normalized.includes('primero')) return 1
    if (normalized.includes('2º') || normalized.includes('2o') || normalized.includes('segundo')) return 2
    if (normalized.includes('3º') || normalized.includes('3o') || normalized.includes('tercero')) return 3
    if (normalized.includes('4º') || normalized.includes('4o') || normalized.includes('cuarto')) return 4

    const numericMatch = normalized.match(/\b([1-4])\b/)
    return numericMatch ? Number(numericMatch[1]) : null
}

const extractPointsLabel = (value?: string) => {
    const normalized = normalizeHistoryText(String(value || ''))
    const pointsMatch = normalized.match(/(\d+)\s*pts?/i)
    if (pointsMatch) return `${pointsMatch[1]}pts`
    return normalized || '--'
}

const safeRrValue = (value: unknown) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return Math.round(numeric)
}

const getLobbyStatusLabel = (status: 'waiting' | 'playing' | 'full') => {
    if (status === 'playing') return 'EN CURSO'
    if (status === 'full') return 'LLENA'
    return 'UNIRSE'
}

const formatRankChange = (value?: string) => {
    const cleaned = normalizeHistoryText(String(value || ''))
    if (!cleaned) return '-- RR'
    if (/rr/i.test(cleaned)) return cleaned.toUpperCase()

    if (/^[+-]?\d+(\.\d+)?$/.test(cleaned)) {
        const numeric = Number(cleaned)
        const signed = numeric > 0 ? `+${numeric}` : `${numeric}`
        return `${signed} RR`
    }

    return cleaned
}

const formatHistoryDate = (value: string) => {
    const isoCandidate = String(value || '').trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(isoCandidate)) {
        return isoCandidate.slice(0, 10)
    }

    const parsedDate = new Date(isoCandidate)
    if (Number.isNaN(parsedDate.getTime())) return isoCandidate || '--'

    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const getHistoryOutcome = (entry: GameHistory): { tone: HistoryTone; label: string } => {
    const mode = normalizeMode(entry.mode)
    const normalizedResult = normalizeResult(entry.result).toLowerCase()

    if (mode === '1vs1vs1vs1') {
        const placement = extractPlacement(entry.result)

        if (placement === 1) return { tone: 'win', label: '1º PUESTO' }
        if (placement === 4) return { tone: 'loss', label: '4º PUESTO' }
        if (placement === 2) return { tone: 'neutral', label: '2º PUESTO' }
        if (placement === 3) return { tone: 'neutral', label: '3º PUESTO' }

        return { tone: 'neutral', label: normalizeResult(entry.result) || 'PUESTO --' }
    }

    if (normalizedResult === 'ganada' || normalizedResult.includes('victoria') || normalizedResult.includes('ganad')) {
        return { tone: 'win', label: 'GANADA' }
    }
    if (normalizedResult === 'perdida' || normalizedResult.includes('derrota') || normalizedResult.includes('perdid')) {
        return { tone: 'loss', label: 'PERDIDA' }
    }

    return { tone: 'neutral', label: 'EMPATE' }
}

const getHistoryScoreValue = (entry: GameHistory) => {
    if (normalizeMode(entry.mode) === '1vs1vs1vs1') {
        return extractPointsLabel(entry.score)
    }
    return normalizeHistoryText(String(entry.score || '')) || '--'
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
        visible: false,
    })

    const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
        setToast({ message, type, visible: true })
        window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
    }

    const fetchPublicGames = async () => {
        const data = await api.games.getPublic()
        const lobbies = Array.isArray(data?.lobbies) ? data.lobbies : []
        setPublicGames(lobbies)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, historyData] = await Promise.all([
                    api.users.getMe(),
                    api.users.getHistory(),
                ])

                setUser(userData)
                setHistory(Array.isArray(historyData) ? historyData : [])
                await fetchPublicGames()
            } catch (err) {
                console.error('Error fetching online game data', err)
                showToast('No se pudieron cargar los datos de jugar online', 'error')
            }
        }

        fetchData()
    }, [])

    const availableGames = useMemo(
        () => publicGames.filter((game) => normalizeLobbyStatus(game.status) !== 'full'),
        [publicGames],
    )

    const visibleGames = useMemo(
        () => availableGames.slice(0, PUBLICATION_SLOTS.length),
        [availableGames],
    )

    const hiddenGamesCount = Math.max(0, availableGames.length - visibleGames.length)

    const handleRefresh = async () => {
        if (isRefreshing) return
        setIsRefreshing(true)
        try {
            await fetchPublicGames()
            showToast('Lista de salas actualizada', 'info')
        } catch (err) {
            console.error('Error refreshing public games', err)
            showToast('Error al actualizar salas', 'error')
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleJoinGame = async (game: GameSession) => {
        const status = normalizeLobbyStatus(game.status)
        if (status !== 'waiting') return

        try {
            await api.games.join(game.game_id)
            onNavigate('waiting-room', {
                gameId: game.game_id,
                mode: normalizeMode(game.mode),
                creator: game.creator,
                returnTo: 'online-game',
            })
        } catch (err: any) {
            showToast(err.message || 'Error al unirse a la partida', 'error')
        }
    }

    const handleCreateGame = async (mode: string) => {
        try {
            const backendMode = mode === '1vs1' ? '1vs1_skills' : '1vs1vs1vs1_skills'
            const res = await api.games.create(backendMode)
            setShowCreateModal(false)
            onNavigate('waiting-room', {
                gameId: res.game_id,
                mode,
                creator: user?.username || 'Yo',
                returnTo: 'online-game',
            })
        } catch (err: any) {
            showToast(err.message || 'Error al crear partida', 'error')
        }
    }

    return (
        <div className="online">
            <img className="online__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="online__overlay" aria-hidden="true"></div>

            <main className="online__layout">
                <h1 className="sr-only">Jugar online</h1>
                <header className="online__header">
                    <img className="online__title-image" src={titleImage} alt="Jugar online" />

                    <div className="online__header-actions">
                        <button
                            className={`online__image-btn ${isRefreshing ? 'online__image-btn--loading' : ''}`}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            aria-label="Actualizar salas publicas"
                            title="Actualizar salas publicas"
                        >
                            <img src={refreshButtonImage} alt="" aria-hidden="true" />
                        </button>

                        <button
                            className="online__image-btn online__image-btn--create"
                            onClick={() => setShowCreateModal(true)}
                            aria-label="Crear partida"
                            title="Crear partida"
                        >
                            <img src={createButtonImage} alt="" aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <div className="online__stage">
                    <section className="online__board-column">
                        <section className="online__board">
                            <img className="online__board-image" src={corkBoardImage} alt="" aria-hidden="true" />

                            <div className="online__board-inner">
                                <p className="online__board-counter">{availableGames.length} salas disponibles</p>

                                {visibleGames.length === 0 ? (
                                    <p className="online__empty online__empty--board">
                                        No hay salas abiertas ahora mismo. Crea una partida para empezar.
                                    </p>
                                ) : (
                                    visibleGames.map((game, index) => {
                                        const status = normalizeLobbyStatus(game.status)
                                        const slot = PUBLICATION_SLOTS[index]
                                        const slotStyle = {
                                            '--slot-top': slot.top,
                                            '--slot-left': slot.left,
                                            '--slot-rotate': `${slot.rotate}deg`,
                                        } as CSSProperties

                                        return (
                                            <article
                                                key={game.game_id}
                                                className={`online-publication online-publication--${status}`}
                                                style={slotStyle}
                                            >
                                                <img className="online-publication__image" src={publicationImage} alt="" aria-hidden="true" />

                                                <div className="online-publication__content">
                                                    <span className="online-publication__host">HOST</span>

                                                    <img
                                                        className="online-publication__avatar"
                                                        src={resolveUserAvatar(game.avatar_url, game.creator)}
                                                        alt={`Avatar de ${game.creator}`}
                                                    />

                                                    <span className="online-publication__name" title={game.creator}>
                                                        {game.creator}
                                                    </span>

                                                    <span className="online-publication__rr">
                                                        {safeRrValue(game.creator_rr)} RR
                                                    </span>

                                                    <span className="online-publication__mode">
                                                        {formatLobbyMode(game.mode)}
                                                    </span>

                                                    <span className="online-publication__players">
                                                        <span className="online-publication__players-icon" aria-hidden="true"></span>
                                                        {game.players}/{game.max_players}
                                                    </span>

                                                    <button
                                                        className={`online-publication__join ${status !== 'waiting' ? 'online-publication__join--disabled' : ''}`}
                                                        disabled={status !== 'waiting'}
                                                        onClick={() => handleJoinGame(game)}
                                                        aria-label={status === 'waiting' ? `Unirse a sala de ${game.creator}` : getLobbyStatusLabel(status)}
                                                        title={status === 'waiting' ? `Unirse a sala de ${game.creator}` : getLobbyStatusLabel(status)}
                                                    >
                                                        <img src={joinButtonImage} alt="" aria-hidden="true" />
                                                        {status !== 'waiting' && (
                                                            <span className="online-publication__join-state">
                                                                {getLobbyStatusLabel(status)}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </article>
                                        )
                                    })
                                )}

                                {hiddenGamesCount > 0 && (
                                    <p className="online__board-overflow">+{hiddenGamesCount} salas mas en cola</p>
                                )}
                            </div>
                        </section>

                        <button
                            className="online__back-btn"
                            onClick={() => onNavigate('menu')}
                            aria-label="Volver al menu"
                            title="Volver al menu"
                        >
                            <img src={backToMenuButtonImage} alt="" />
                        </button>
                    </section>

                    <aside className="online__status-panel">
                        <img className="online__status-image" src={statusImage} alt="Tu estatus y tu historial" />

                        <p className="online__status-elo">{safeRrValue(user?.elo)} RR</p>

                        <div className="online__history-list">
                            {history.length === 0 ? (
                                <p className="online__empty online__empty--history">Todavia no hay partidas registradas.</p>
                            ) : (
                                history.slice(0, 7).map((entry, index) => {
                                    const outcome = getHistoryOutcome(entry)
                                    const rankChange = formatRankChange(entry.rankChange)
                                    const scoreValue = getHistoryScoreValue(entry)
                                    const modeValue = formatHistoryMode(entry.mode)

                                    return (
                                        <article
                                            key={`${entry.id ?? 'history'}-${index}`}
                                            className={`online-history-row online-history-row--${outcome.tone}`}
                                        >
                                            <span className="online-history-row__accent" aria-hidden="true"></span>

                                            <div className="online-history-row__main">
                                                <span className="online-history-row__result">
                                                    {outcome.label}
                                                </span>

                                                <div className="online-history-row__bottom">
                                                    <span className="online-history-row__score">{scoreValue}</span>
                                                    <span className="online-history-row__mode">{modeValue}</span>
                                                </div>
                                            </div>

                                            <span className="online-history-row__date">{formatHistoryDate(entry.date)}</span>
                                            <span className="online-history-row__rr">{rankChange}</span>
                                        </article>
                                    )
                                })
                            )}
                        </div>
                    </aside>
                </div>
            </main>

            <div
                className={`popup-toast popup-toast--${toast.type} ${toast.visible ? 'popup-toast--visible' : ''}`}
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <span className="popup-toast__icon">
                    {toast.type === 'success' && 'OK'}
                    {toast.type === 'info' && 'i'}
                    {toast.type === 'error' && 'X'}
                </span>
                <span className="popup-toast__message">{toast.message}</span>
            </div>

            <GameModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Crear nueva partida"
                subtitle="Elige el modo para tu sala publica"
                onSelectMode={handleCreateGame}
            />
        </div>
    )
}

export default OnlineGame
