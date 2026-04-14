import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/Profile.css'

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
            ? 'Volver a Ranking'
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

    const handleSaveSettings = async () => {
        setSettingsError('')
        setSettingsSuccess('')

        if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
            setSettingsError('Las contraseñas nuevas no coinciden.')
            return
        }
        if (settingsForm.newPassword && !settingsForm.currentPassword) {
            setSettingsError('Debes indicar tu contraseña actual para cambiarla.')
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
                setSettingsSuccess('No hay cambios que guardar.')
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
                <header className="profile__header">
                    <div className="profile__hero">
                        <img
                            className="profile__avatar"
                            src={resolveUserAvatar(stats?.avatar_url, displayName)}
                            alt={`Avatar de ${displayName}`}
                        />
                        <div className="profile__hero-info">
                            <div className="profile__hero-main-row">
                                <h1 className="profile__name">{displayName}</h1>
                                <div className="profile__elo-badge">
                                    <span className="profile__elo-value">{stats?.elo ?? 1000} RR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <nav className="profile__tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={`profile__tab${activeTab === tab.key ? ' profile__tab--active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {activeTab === 'resumen' && (
                        <nav className="profile__mode-tabs">
                            {statsModeTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`profile__mode-tab${activeStatsMode === tab.key ? ' profile__mode-tab--active' : ''}`}
                                    onClick={() => setActiveStatsMode(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    )}
                </header>

                {loading ? (
                    <div className="profile__loading">
                        <div className="profile__spinner" />
                        <span>Cargando datos...</span>
                    </div>
                ) : error ? (
                    <div className="profile__error">{error}</div>
                ) : (
                    <>
                        {activeTab === 'resumen' && (
                            <div className={`profile__body${isOwnProfile ? '' : ' profile__body--friend'}`}>
                                <div className={`profile__sidebar${isOwnProfile ? ' profile__sidebar--summary' : ' profile__sidebar--friend'}`}>
                                    <div className="profile__card profile__card--winrate">
                                        <h3 className="profile__card-title">Win Rate</h3>
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

                                    <div className="profile__card">
                                        <h3 className="profile__card-title">Estadisticas</h3>
                                        <ul className="profile__stat-list">
                                            <li className="profile__stat-row">
                                                <span className="profile__stat-label">Partidas jugadas</span>
                                                <strong className="profile__stat-val">{modeStats.total_games ?? 0}</strong>
                                            </li>
                                            {!isFourPlayersMode && (
                                                <>
                                                    <li className="profile__stat-row">
                                                        <span className="profile__stat-label profile__stat-label--win">Victorias</span>
                                                        <strong className="profile__stat-val profile__stat-val--win">{modeStats.wins ?? 0}</strong>
                                                    </li>
                                                    <li className="profile__stat-row">
                                                        <span className="profile__stat-label profile__stat-label--loss">Derrotas</span>
                                                        <strong className="profile__stat-val profile__stat-val--loss">{modeStats.losses ?? 0}</strong>
                                                    </li>
                                                    <li className="profile__stat-row profile__stat-row--last">
                                                        <span className="profile__stat-label profile__stat-label--draw">Empates</span>
                                                        <strong className="profile__stat-val profile__stat-val--draw">{modeStats.draws ?? 0}</strong>
                                                    </li>
                                                </>
                                            )}
                                            {isFourPlayersMode && (
                                                <>
                                                    <li className="profile__stat-row">
                                                        <span className="profile__stat-label profile__stat-label--win">1º puesto</span>
                                                        <strong className="profile__stat-val profile__stat-val--win">{modeStats.first_place ?? 0}</strong>
                                                    </li>
                                                    <li className="profile__stat-row">
                                                        <span className="profile__stat-label">2º puesto</span>
                                                        <strong className="profile__stat-val">{modeStats.second_place ?? 0}</strong>
                                                    </li>
                                                    <li className="profile__stat-row">
                                                        <span className="profile__stat-label">3º puesto</span>
                                                        <strong className="profile__stat-val">{modeStats.third_place ?? 0}</strong>
                                                    </li>
                                                    <li className="profile__stat-row profile__stat-row--last">
                                                        <span className="profile__stat-label profile__stat-label--loss">4º puesto</span>
                                                        <strong className="profile__stat-val profile__stat-val--loss">{modeStats.fourth_place ?? 0}</strong>
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </div>

                                    {userId && (
                                        <div className="profile__card profile__card--h2h">
                                            <h3 className="profile__card-title">
                                                <span className="profile__h2h-icon">⚔️</span>
                                                Tus resultados contra {displayName}
                                            </h3>
                                            {h2h ? (
                                                <ul className="profile__stat-list">
                                                    {activeStatsMode === '1vs1' ? (
                                                        <>
                                                            <li className="profile__stat-row">
                                                                <span className="profile__stat-label">Partidas jugadas</span>
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
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="profile__stat-row">
                                                                <span className="profile__stat-label">Partidas juntos</span>
                                                                <strong className="profile__stat-val">{h2h.total_matches_4p ?? 0}</strong>
                                                            </li>
                                                            <li className="profile__stat-row">
                                                                <span className="profile__stat-label profile__stat-label--win">Tus 1º puestos</span>
                                                                <strong className="profile__stat-val profile__stat-val--win">{h2h.first_places_4p ?? 0}</strong>
                                                            </li>
                                                            <li className="profile__stat-row profile__stat-row--last">
                                                                <span className="profile__stat-label profile__stat-label--loss">2º, 3º o 4º puesto</span>
                                                                <strong className="profile__stat-val profile__stat-val--loss">{h2h.other_places_4p ?? 0}</strong>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="profile__empty">Sin enfrentamientos previos.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {isOwnProfile && (
                                    <div className="profile__highlights">
                                        <div className="profile__stat-card profile__stat-card--peak">
                                            <span className="profile__stat-card-icon">👑</span>
                                            <div className="profile__stat-card-body">
                                                <span className="profile__stat-card-label">Pico de RR</span>
                                                <span className="profile__stat-card-value">{modeStats.peak_elo ?? stats?.peak_elo ?? stats?.elo ?? 1000}</span>
                                                <span className="profile__stat-card-hint">Maximo historico</span>
                                            </div>
                                        </div>

                                        <div className="profile__stat-card profile__stat-card--streak">
                                            <span className="profile__stat-card-icon">🔥</span>
                                            <div className="profile__stat-card-body">
                                                <span className="profile__stat-card-label">Mejor racha</span>
                                                <span className="profile__stat-card-value">{modeStats.win_streak ?? 0}</span>
                                                <span className="profile__stat-card-hint">{isFourPlayersMode ? '1º puestos seguidos' : 'Victorias seguidas'}</span>
                                            </div>
                                        </div>

                                        <div className="profile__rival-card profile__rival-card--nemesis">
                                            <div className="profile__rival-badge">😈</div>
                                            <div className="profile__rival-body">
                                                <span className="profile__rival-role">Tu nemesis</span>
                                                <span className="profile__rival-name">{modeStats.nemesis_name ?? '—'}</span>
                                                {modeStats.nemesis_losses != null && modeStats.nemesis_losses > 0 && (
                                                    <span className="profile__rival-info">
                                                        {isFourPlayersMode ? 'Te ha superado ' : 'Te ha ganado '}
                                                        <strong>{modeStats.nemesis_losses}</strong> veces
                                                    </span>
                                                )}
                                                {!modeStats.nemesis_name && <span className="profile__rival-empty">Aun sin rival destacado</span>}
                                            </div>
                                        </div>

                                        <div className="profile__rival-card profile__rival-card--victim">
                                            <div className="profile__rival-badge">😇</div>
                                            <div className="profile__rival-body">
                                                <span className="profile__rival-role">Tu victima</span>
                                                <span className="profile__rival-name">{modeStats.victim_name ?? '—'}</span>
                                                {modeStats.victim_wins != null && modeStats.victim_wins > 0 && (
                                                    <span className="profile__rival-info">
                                                        {isFourPlayersMode ? 'Le has superado ' : 'Le has ganado '}
                                                        <strong>{modeStats.victim_wins}</strong> veces
                                                    </span>
                                                )}
                                                {!modeStats.victim_name && <span className="profile__rival-empty">Aun sin victima favorita</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ajustes' && isOwnProfile && (
                            <div className="profile__settings">
                                <div className="profile__card profile__settings-card">
                                    <h3 className="profile__card-title">Cambiar los datos de tu cuenta</h3>
                                    <div className="profile__settings-form">
                                        <div className="profile__form-group">
                                            <label className="profile__form-label">Nombre de usuario</label>
                                            <input
                                                className="profile__form-input"
                                                type="text"
                                                value={settingsForm.username}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, username: e.target.value }))}
                                                placeholder="Tu nombre de usuario"
                                            />
                                        </div>
                                        <div className="profile__form-group">
                                            <label className="profile__form-label">Email</label>
                                            <input
                                                className="profile__form-input"
                                                type="email"
                                                value={settingsForm.email}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                                                placeholder="tu@email.com"
                                            />
                                        </div>

                                        <div className="profile__form-group">
                                            <label className="profile__form-label">Contraseña actual</label>
                                            <input
                                                className="profile__form-input"
                                                type="password"
                                                value={settingsForm.currentPassword}
                                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="profile__form-row">
                                            <div className="profile__form-group">
                                                <label className="profile__form-label">Nueva contraseña</label>
                                                <input
                                                    className="profile__form-input"
                                                    type="password"
                                                    value={settingsForm.newPassword}
                                                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="profile__form-group">
                                                <label className="profile__form-label">Confirmar contraseña</label>
                                                <input
                                                    className="profile__form-input"
                                                    type="password"
                                                    value={settingsForm.confirmPassword}
                                                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        {settingsError && <p className="profile__form-error">{settingsError}</p>}
                                        {settingsSuccess && <p className="profile__form-success">{settingsSuccess}</p>}

                                        <button className="profile__form-save-btn" onClick={handleSaveSettings} disabled={savingSettings}>
                                            {savingSettings ? 'Guardando...' : '💾 Guardar cambios'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <button className="profile__back-btn" onClick={() => onNavigate(backScreen)}>
                    {backLabel}
                </button>
            </div>
        </div>
    )
}

export default Profile
