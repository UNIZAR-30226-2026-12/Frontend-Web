import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/pages/Profile.css'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import backToMenuButtonImage from '../assets/elementosGenerales/botonVolverMenu.png'
import winRateCard from '../assets/estadisticas/winRate.png'
import picoRRCard from '../assets/estadisticas/picoRR.png'
import rachaCard from '../assets/estadisticas/racha.png'
import estadisticasCard from '../assets/estadisticas/estadisticas.png'
import estadisticas4pCard from '../assets/estadisticas/estadisticas4p.png'
import nemesisCard from '../assets/estadisticas/nemesis.png'
import victimaCard from '../assets/estadisticas/victima.png'

interface ProfileProps {
    onNavigate: (screen: string, data?: any) => void
    userId?: number
    username?: string
    returnTo?: string
}

interface ModeStats {
    elo?: number
    peak_elo?: number
    total_games: number
    wins: number
    losses: number
    draws: number
    winrate: number
    win_streak: number
    winrate_black?: number
    winrate_white?: number
    first_place?: number
    second_place?: number
    third_place?: number
    fourth_place?: number
    nemesis_name?: string | null
    nemesis_losses?: number
    victim_name?: string | null
    victim_wins?: number
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
    peak_elo?: number
    win_streak?: number
    winrate_black?: number
    winrate_white?: number
    nemesis_name?: string
    nemesis_losses?: number
    victim_name?: string
    victim_wins?: number
    stats_1v1?: ModeStats
    stats_4p?: ModeStats
}

interface H2H {
    total_matches: number
    wins: number
    losses: number
    draws: number
    total_matches_4p?: number
    first_places_4p?: number
    other_places_4p?: number
}

type ActiveTab = 'resumen' | 'ajustes'
type StatsModeTab = '1vs1' | '1vs1vs1vs1'

const EMPTY_MODE_STATS: ModeStats = {
    total_games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winrate: 0,
    win_streak: 0,
    first_place: 0,
    second_place: 0,
    third_place: 0,
    fourth_place: 0,
    nemesis_name: null,
    nemesis_losses: 0,
    victim_name: null,
    victim_wins: 0,
}

function clampPercent(value: number) {
    return Math.max(0, Math.min(100, value || 0))
}

function getLegacy1v1Stats(stats: Stats | null): ModeStats {
    if (!stats) return { ...EMPTY_MODE_STATS }
    return {
        total_games: stats.total_games ?? 0,
        wins: stats.wins ?? 0,
        losses: stats.losses ?? 0,
        draws: stats.draws ?? 0,
        winrate: stats.winrate ?? 0,
        win_streak: stats.win_streak ?? 0,
        peak_elo: stats.peak_elo,
        winrate_black: stats.winrate_black,
        winrate_white: stats.winrate_white,
        nemesis_name: stats.nemesis_name,
        nemesis_losses: stats.nemesis_losses ?? 0,
        victim_name: stats.victim_name,
        victim_wins: stats.victim_wins ?? 0,
    }
}

function Profile({ onNavigate, userId, username, returnTo }: ProfileProps) {
    const [stats, setStats] = useState<Stats | null>(null)
    const [h2h, setH2h] = useState<H2H | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<ActiveTab>('resumen')
    const [activeStatsMode, setActiveStatsMode] = useState<StatsModeTab>('1vs1')

    const [settingsForm, setSettingsForm] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [settingsError, setSettingsError] = useState('')
    const [settingsSuccess, setSettingsSuccess] = useState('')
    const [savingSettings, setSavingSettings] = useState(false)

    const isOwnProfile = !userId
    const backScreen = isOwnProfile ? 'menu' : returnTo === 'ranking' ? 'ranking' : 'friends'
    const backLabel = isOwnProfile
        ? 'Volver al menu'
        : returnTo === 'ranking'
            ? 'Volver a ranking'
            : 'Volver a amigos'

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true)
            setError('')

            try {
                const targetId = userId || 'me'
                const data = await api.users.getStats(targetId as any)
                setStats(data)
                setSettingsForm((prev) => ({ ...prev, username: data.username || '' }))

                if (!userId) {
                    try {
                        const me = await api.users.getMe()
                        setStats((prev) => (prev ? { ...prev, avatar_url: me.avatar_url ?? prev.avatar_url } : prev))
                        setSettingsForm((prev) => ({
                            ...prev,
                            username: me.username || data.username || '',
                            email: me.email || '',
                        }))
                    } catch {
                        setSettingsForm((prev) => ({ ...prev, email: '' }))
                    }
                }

                if (userId) {
                    try {
                        const h2hData = await api.users.getH2H(userId)
                        setH2h(h2hData)
                    } catch {
                        setH2h(null)
                    }
                }
            } catch {
                setError('No se pudo cargar el perfil.')
            } finally {
                setLoading(false)
            }
        }

        fetchProfileData()
    }, [userId])

    const modeStats = useMemo<ModeStats>(() => {
        if (activeStatsMode === '1vs1') {
            return stats?.stats_1v1 ?? getLegacy1v1Stats(stats)
        }
        return stats?.stats_4p ?? { ...EMPTY_MODE_STATS, peak_elo: stats?.peak_elo }
    }, [activeStatsMode, stats])

    const displayName = stats?.username || username || 'Usuario'
    const winRate = clampPercent(modeStats.winrate)
    const isFourPlayersMode = activeStatsMode === '1vs1vs1vs1'
    const peakElo = modeStats.peak_elo ?? stats?.peak_elo ?? stats?.elo ?? 1000
    const nemesisHits = modeStats.nemesis_losses ?? 0
    const victimWins = modeStats.victim_wins ?? 0

    const other4PPlacements =
        (modeStats.second_place ?? 0) +
        (modeStats.third_place ?? 0) +
        (modeStats.fourth_place ?? 0)

    const statsCardValues = isFourPlayersMode
        ? [modeStats.total_games ?? 0, modeStats.first_place ?? 0, other4PPlacements]
        : [modeStats.total_games ?? 0, modeStats.wins ?? 0, modeStats.losses ?? 0, modeStats.draws ?? 0]

    const statsRows = isFourPlayersMode
        ? [
            { label: 'Partidas jugadas', value: modeStats.total_games ?? 0 },
            { label: '1º puesto', value: modeStats.first_place ?? 0 },
            { label: '2º, 3º o 4º puestos', value: other4PPlacements },
        ]
        : [
            { label: 'Partidas jugadas', value: modeStats.total_games ?? 0 },
            { label: 'Victorias', value: modeStats.wins ?? 0 },
            { label: 'Derrotas', value: modeStats.losses ?? 0 },
            { label: 'Empates', value: modeStats.draws ?? 0 },
        ]

    const handleSaveSettings = async () => {
        setSettingsError('')
        setSettingsSuccess('')

        if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
            setSettingsError('Las contrasenas nuevas no coinciden.')
            return
        }
        if (settingsForm.newPassword && !settingsForm.currentPassword) {
            setSettingsError('Debes indicar tu contrasena actual para cambiarla.')
            return
        }

        setSavingSettings(true)

        try {
            const updates: any = {}
            if (settingsForm.username && settingsForm.username !== stats?.username) updates.username = settingsForm.username
            if (settingsForm.email) updates.email = settingsForm.email
            if (settingsForm.newPassword) {
                updates.current_password = settingsForm.currentPassword
                updates.new_password = settingsForm.newPassword
            }

            if (Object.keys(updates).length === 0) {
                setSettingsSuccess('No hay cambios para guardar.')
                setSavingSettings(false)
                return
            }

            await api.users.updateMe(updates)
            setSettingsSuccess('Ajustes guardados correctamente.')
            setStats((prev) => (prev ? { ...prev, username: updates.username ?? prev.username } : prev))
            setSettingsForm((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }))
        } catch (e: any) {
            setSettingsError(e.message || 'Error al guardar ajustes.')
        } finally {
            setSavingSettings(false)
        }
    }

    const tabs: { key: ActiveTab; label: string; icon: string }[] = isOwnProfile
        ? [
            { key: 'resumen', label: 'Tus estadisticas', icon: '📊' },
            { key: 'ajustes', label: 'Ajustes', icon: '⚙️' },
        ]
        : [{ key: 'resumen', label: 'Sus estadisticas', icon: '📊' }]

    const statsModeTabs: { key: StatsModeTab; label: string }[] = [
        { key: '1vs1', label: 'Estadisticas 1vs1' },
        { key: '1vs1vs1vs1', label: 'Estadisticas 1vs1vs1vs1' },
    ]

    const circleRadius = 32
    const circleCircumference = 2 * Math.PI * circleRadius
    const winStroke = (winRate / 100) * circleCircumference

    return (
        <div className="profile">
            <img className="profile__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="profile__overlay" aria-hidden="true" />

            <div className="profile__container">
                <header className="profile__header">
                    <div className="profile__masthead">
                        <div className="profile__identity">
                            <div className="profile__avatar-shell">
                                <img
                                    className="profile__avatar"
                                    src={resolveUserAvatar(stats?.avatar_url, displayName)}
                                    alt={`Avatar de ${displayName}`}
                                />
                            </div>
                            <h1 className="profile__name">{displayName}</h1>
                            <span className="profile__rr-badge">{stats?.elo ?? 1000} RR</span>
                        </div>

                        <nav className="profile__tabs" role="tablist" aria-label="Secciones del perfil">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`profile__tab profile__tab--${tab.key}${activeTab === tab.key ? ' profile__tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                    type="button"
                                    role="tab"
                                    id={`profile-tab-${tab.key}`}
                                    aria-selected={activeTab === tab.key}
                                    aria-controls={`profile-panel-${tab.key}`}
                                >
                                    <span className="profile__tab-icon">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {activeTab === 'resumen' && (
                        <nav className="profile__mode-tabs" aria-label="Modo de estadisticas">
                            {statsModeTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`profile__mode-tab${activeStatsMode === tab.key ? ' profile__mode-tab--active' : ''}`}
                                    onClick={() => setActiveStatsMode(tab.key)}
                                    type="button"
                                    aria-pressed={activeStatsMode === tab.key}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    )}
                </header>

                <main className="profile__content">
                    {loading ? (
                        <div className="profile__state-card" role="status">
                            <div className="profile__spinner" />
                            <span>Cargando datos...</span>
                        </div>
                    ) : error ? (
                        <div className="profile__state-card profile__state-card--error" role="alert">{error}</div>
                    ) : activeTab === 'resumen' ? (
                        isOwnProfile ? (
                            <section
                                className="profile__summary-stage"
                                id="profile-panel-resumen"
                                role="tabpanel"
                                aria-labelledby="profile-tab-resumen"
                            >
                                <div className="profile__proto-grid">
                                    <article className="profile__proto-card profile__proto-card--winrate">
                                        <img className="profile__proto-bg" src={winRateCard} alt="" aria-hidden="true" />
                                        <div className="profile__proto-content profile__proto-content--winrate">
                                            <div className="profile__winrate-circle">
                                                <svg viewBox="0 0 80 80" className="profile__winrate-svg">
                                                    <circle cx="40" cy="40" r={circleRadius} className="profile__winrate-track" />
                                                    <circle
                                                        cx="40"
                                                        cy="40"
                                                        r={circleRadius}
                                                        className="profile__winrate-fill profile__winrate-fill--loss"
                                                        strokeDasharray={`${circleCircumference} ${circleCircumference}`}
                                                    />
                                                    <circle
                                                        cx="40"
                                                        cy="40"
                                                        r={circleRadius}
                                                        className="profile__winrate-fill profile__winrate-fill--win"
                                                        strokeDasharray={`${winStroke} ${circleCircumference}`}
                                                    />
                                                </svg>
                                                <span className="profile__winrate-label">{winRate}%</span>
                                            </div>

                                            <div className="profile__winrate-legend">
                                                <span className="profile__legend-dot profile__legend-dot--win" />
                                                <span>{isFourPlayersMode ? '1º puesto' : 'Victorias'}</span>
                                                <span className="profile__legend-dot profile__legend-dot--loss" />
                                                <span>{isFourPlayersMode ? '2º, 3º o 4º puesto' : 'Derrotas'}</span>
                                            </div>
                                        </div>
                                    </article>

                                    <article className="profile__proto-card profile__proto-card--peak">
                                        <img className="profile__proto-bg" src={picoRRCard} alt="" aria-hidden="true" />
                                        <div className="profile__proto-content profile__proto-content--peak">
                                            <span className="profile__proto-value">{peakElo}</span>
                                            <span className="profile__proto-subtext">Maximo historico</span>
                                        </div>
                                    </article>

                                    <article className="profile__proto-card profile__proto-card--streak">
                                        <img className="profile__proto-bg" src={rachaCard} alt="" aria-hidden="true" />
                                        <div className="profile__proto-content profile__proto-content--streak">
                                            <span className="profile__proto-value">{modeStats.win_streak ?? 0}</span>
                                        </div>
                                    </article>

                                    <article className="profile__proto-card profile__proto-card--stats">
                                        <img
                                            className="profile__proto-bg"
                                            src={isFourPlayersMode ? estadisticas4pCard : estadisticasCard}
                                            alt=""
                                            aria-hidden="true"
                                        />
                                        <div className="profile__proto-content profile__proto-content--stats">
                                            {statsCardValues.map((value, index) => (
                                                <span key={index} className="profile__proto-stats-value">{value}</span>
                                            ))}
                                        </div>
                                    </article>

                                    <article className="profile__proto-card profile__proto-card--nemesis">
                                        <img className="profile__proto-bg" src={nemesisCard} alt="" aria-hidden="true" />
                                        <div className="profile__proto-content profile__proto-content--nemesis">
                                            <span className="profile__proto-name">{modeStats.nemesis_name || '--'}</span>
                                            <span className="profile__proto-text">
                                                {modeStats.nemesis_name
                                                    ? `${isFourPlayersMode ? 'Te supera' : 'Te gana'} ${nemesisHits} ${nemesisHits === 1 ? 'vez' : 'veces'}`
                                                    : 'Aun sin rival destacado'}
                                            </span>
                                        </div>
                                    </article>

                                    <article className="profile__proto-card profile__proto-card--victim">
                                        <img className="profile__proto-bg" src={victimaCard} alt="" aria-hidden="true" />
                                        <div className="profile__proto-content profile__proto-content--victim">
                                            <span className="profile__proto-name">{modeStats.victim_name || '--'}</span>
                                            <span className="profile__proto-text">
                                                {modeStats.victim_name
                                                    ? `${isFourPlayersMode ? 'Le superas' : 'Le ganas'} ${victimWins} ${victimWins === 1 ? 'vez' : 'veces'}`
                                                    : 'Aun sin victima destacada'}
                                            </span>
                                        </div>
                                    </article>
                                </div>
                            </section>
                        ) : (
                            <section
                                className="profile__friend-grid"
                                id="profile-panel-resumen"
                                role="tabpanel"
                                aria-labelledby="profile-tab-resumen"
                            >
                                <article className="profile__paper-card profile__paper-card--friend-winrate">
                                    <h3 className="profile__paper-title">Win Rate</h3>
                                    <div className="profile__friend-winrate-body">
                                        <div className="profile__winrate-circle">
                                            <svg viewBox="0 0 80 80" className="profile__winrate-svg">
                                                <circle cx="40" cy="40" r={circleRadius} className="profile__winrate-track" />
                                                <circle
                                                    cx="40"
                                                    cy="40"
                                                    r={circleRadius}
                                                    className="profile__winrate-fill profile__winrate-fill--loss"
                                                    strokeDasharray={`${circleCircumference} ${circleCircumference}`}
                                                />
                                                <circle
                                                    cx="40"
                                                    cy="40"
                                                    r={circleRadius}
                                                    className="profile__winrate-fill profile__winrate-fill--win"
                                                    strokeDasharray={`${winStroke} ${circleCircumference}`}
                                                />
                                            </svg>
                                            <span className="profile__winrate-label">{winRate}%</span>
                                        </div>
                                        <div className="profile__winrate-legend profile__winrate-legend--friend">
                                            <span className="profile__legend-dot profile__legend-dot--win" />
                                            <span>{isFourPlayersMode ? '1º puesto' : 'Victorias'}</span>
                                            <span className="profile__legend-dot profile__legend-dot--loss" />
                                            <span>{isFourPlayersMode ? '2º, 3º o 4º puesto' : 'Derrotas'}</span>
                                        </div>
                                    </div>
                                </article>
                                <article className="profile__paper-card">
                                    <h3 className="profile__paper-title">Estadisticas</h3>
                                    <ul className="profile__simple-list">
                                        {statsRows.map((row) => (
                                            <li key={row.label} className="profile__simple-row">
                                                <span>{row.label}</span>
                                                <strong>{row.value}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                {userId && (
                                    <article className="profile__paper-card">
                                        <h3 className="profile__paper-title">Cara a cara</h3>
                                        {h2h ? (
                                            <ul className="profile__simple-list">
                                                {activeStatsMode === '1vs1' ? (
                                                    <>
                                                        <li className="profile__simple-row"><span>Partidas</span><strong>{h2h.total_matches}</strong></li>
                                                        <li className="profile__simple-row"><span>Tus victorias</span><strong>{h2h.wins}</strong></li>
                                                        <li className="profile__simple-row"><span>Tus derrotas</span><strong>{h2h.losses}</strong></li>
                                                        <li className="profile__simple-row"><span>Empates</span><strong>{h2h.draws}</strong></li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li className="profile__simple-row"><span>Partidas juntos</span><strong>{h2h.total_matches_4p ?? 0}</strong></li>
                                                        <li className="profile__simple-row"><span>Tus 1º puestos</span><strong>{h2h.first_places_4p ?? 0}</strong></li>
                                                        <li className="profile__simple-row"><span>2º, 3º o 4º puestos</span><strong>{h2h.other_places_4p ?? 0}</strong></li>
                                                    </>
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="profile__empty-text">Sin enfrentamientos previos.</p>
                                        )}
                                    </article>
                                )}
                            </section>
                        )
                    ) : (
                        isOwnProfile && (
                            <section
                                className="profile__settings-stage"
                                id="profile-panel-ajustes"
                                role="tabpanel"
                                aria-labelledby="profile-tab-ajustes"
                            >
                                <div className="profile__paper-card profile__paper-card--settings">
                                    <h3 className="profile__paper-title">Ajustes de cuenta</h3>

                                    <form
                                        className="profile__form-grid"
                                        onSubmit={(e) => { e.preventDefault(); handleSaveSettings() }}
                                        noValidate
                                    >
                                        <label className="profile__form-field">
                                            <span>Nombre de usuario</span>
                                            <input
                                                className="profile__form-input"
                                                type="text"
                                                value={settingsForm.username}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, username: e.target.value }))}
                                                placeholder="Tu nombre"
                                                autoComplete="username"
                                            />
                                        </label>

                                        <label className="profile__form-field">
                                            <span>Email</span>
                                            <input
                                                className="profile__form-input"
                                                type="email"
                                                value={settingsForm.email}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                                                placeholder="tu@email.com"
                                                autoComplete="email"
                                            />
                                        </label>

                                        <label className="profile__form-field">
                                            <span>Contrasena actual</span>
                                            <input
                                                className="profile__form-input"
                                                type="password"
                                                value={settingsForm.currentPassword}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                                placeholder="********"
                                                autoComplete="current-password"
                                            />
                                        </label>

                                        <div className="profile__form-field" />

                                        <label className="profile__form-field">
                                            <span>Nueva contrasena</span>
                                            <input
                                                className="profile__form-input"
                                                type="password"
                                                value={settingsForm.newPassword}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                                placeholder="********"
                                                autoComplete="new-password"
                                            />
                                        </label>

                                        <label className="profile__form-field">
                                            <span>Confirmar nueva contrasena</span>
                                            <input
                                                className="profile__form-input"
                                                type="password"
                                                value={settingsForm.confirmPassword}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                                placeholder="********"
                                                autoComplete="new-password"
                                            />
                                        </label>

                                        {settingsError && <p className="profile__form-msg profile__form-msg--error" role="alert">{settingsError}</p>}
                                        {settingsSuccess && <p className="profile__form-msg profile__form-msg--ok" role="status">{settingsSuccess}</p>}

                                        <button type="submit" className="profile__save-btn" disabled={savingSettings}>
                                            {savingSettings ? 'Guardando...' : 'Guardar cambios'}
                                        </button>
                                    </form>
                                </div>
                            </section>
                        )
                    )}
                </main>

                <footer className="profile__footer">
                    {isOwnProfile ? (
                        <button
                            className="profile__image-btn profile__image-btn--back"
                            onClick={() => onNavigate(backScreen)}
                            aria-label={backLabel}
                            title={backLabel}
                        >
                            <img src={backToMenuButtonImage} alt="" />
                        </button>
                    ) : (
                        <button className="profile__back-text-btn" onClick={() => onNavigate(backScreen)}>
                            {backLabel}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    )
}

export default Profile
