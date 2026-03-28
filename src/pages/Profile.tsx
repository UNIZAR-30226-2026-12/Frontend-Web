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
    peak_elo?: number
    win_streak?: number
    winrate_black?: number
    winrate_white?: number
    nemesis_name?: string
    nemesis_losses?: number
    victim_name?: string
    victim_wins?: number
}

interface H2H {
    total_matches: number
    wins: number
    losses: number
    draws: number
}

type ActiveTab = 'resumen' | 'ajustes'

function getWinRateSegments(winrate: number) {
    return Math.max(0, Math.min(100, winrate))
}

function Profile({ onNavigate, userId, username }: ProfileProps) {
    const [stats, setStats] = useState<Stats | null>(null)
    const [h2h, setH2h] = useState<H2H | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<ActiveTab>('resumen')

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

    const displayName = stats?.username || username || 'Usuario'
    const winRate = stats?.winrate ?? 0

    const handleSaveSettings = async () => {
        setSettingsError('')
        setSettingsSuccess('')

        if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
            setSettingsError('Las contrase�as nuevas no coinciden.')
            return
        }
        if (settingsForm.newPassword && !settingsForm.currentPassword) {
            setSettingsError('Debes indicar tu contrase�a actual para cambiarla.')
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
            { key: 'resumen', label: 'Tus estadísticas', icon: '📊' },
            { key: 'ajustes', label: 'Ajustes', icon: '⚙️' },
        ]
        : [{ key: 'resumen', label: `Sus estadísticas`, icon: '📊' }]

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
                                <div
                                    className={`profile__sidebar${isOwnProfile
                                        ? ' profile__sidebar--summary'
                                        : ' profile__sidebar--friend'
                                        }`}
                                >
                                    <div className="profile__card profile__card--winrate">
                                        <h3 className="profile__card-title">🏅 Win Rate Global</h3>
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

                                    <div className="profile__card">
                                        <h3 className="profile__card-title">📋 Estadisticas Globales</h3>
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

                                    {userId && (
                                        <div className="profile__card profile__card--h2h">
                                            <h3 className="profile__card-title">
                                                <span className="profile__h2h-icon">⚔️</span>
                                                Tus Resultados Contra {displayName}
                                            </h3>
                                            {h2h ? (
                                                <ul className="profile__stat-list">
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
                                                <span className="profile__stat-card-value">{stats?.peak_elo ?? stats?.elo ?? 1000}</span>
                                                <span className="profile__stat-card-hint">Maximo historico</span>
                                            </div>
                                        </div>

                                        <div className="profile__stat-card profile__stat-card--streak">
                                            <span className="profile__stat-card-icon">🔥</span>
                                            <div className="profile__stat-card-body">
                                                <span className="profile__stat-card-label">Mejor Racha</span>
                                                <span className="profile__stat-card-value">{stats?.win_streak ?? 0}</span>
                                                <span className="profile__stat-card-hint">Victorias seguidas</span>
                                            </div>
                                        </div>

                                        <div className="profile__rival-card profile__rival-card--nemesis">
                                            <div className="profile__rival-badge">😈</div>
                                            <div className="profile__rival-body">
                                                <span className="profile__rival-role">Tu Nemesis</span>
                                                <span className="profile__rival-name">{stats?.nemesis_name ?? '—'}</span>
                                                {stats?.nemesis_losses != null && stats.nemesis_losses > 0 && (
                                                    <span className="profile__rival-info">
                                                        Te ha ganado <strong>{stats.nemesis_losses}</strong> veces
                                                    </span>
                                                )}
                                                {!stats?.nemesis_name && (
                                                    <span className="profile__rival-empty">Aun sin rival temido</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="profile__rival-card profile__rival-card--victim">
                                            <div className="profile__rival-badge">😇</div>
                                            <div className="profile__rival-body">
                                                <span className="profile__rival-role">Tu Victima</span>
                                                <span className="profile__rival-name">{stats?.victim_name ?? '—'}</span>
                                                {stats?.victim_wins != null && stats.victim_wins > 0 && (
                                                    <span className="profile__rival-info">
                                                        Le has ganado <strong>{stats.victim_wins}</strong> veces
                                                    </span>
                                                )}
                                                {!stats?.victim_name && (
                                                    <span className="profile__rival-empty">Aun sin victima favorita</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ajustes' && isOwnProfile && (
                            <div className="profile__settings">
                                <div className="profile__card profile__settings-card">
                                    <h3 className="profile__card-title">👤 Cambiar los datos de tu cuenta</h3>
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

                                        <button
                                            className="profile__form-save-btn"
                                            onClick={handleSaveSettings}
                                            disabled={savingSettings}
                                        >
                                            {savingSettings ? 'Guardando...' : '💾 Guardar cambios'}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </>
                )}

                <button className="profile__back-btn" onClick={() => onNavigate(userId ? 'friends' : 'menu')}>
                    {userId ? 'Volver a amigos' : 'Volver al menu'}
                </button>
            </div>
        </div>
    )
}

export default Profile

