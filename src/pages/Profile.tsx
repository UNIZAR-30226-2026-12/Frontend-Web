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
    // Estadísticas avanzadas (pueden no venir del backend aún → fallback a 0)
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

type ActiveTab = 'resumen' | 'stats' | 'ajustes'

function getResultColor(result: string) {
    if (result === 'Ganada') return '#4ade80'
    if (result === 'Perdida') return '#f87171'
    return '#fbbf24'
}

function getWinRateSegments(winrate: number) {
    const clamped = Math.max(0, Math.min(100, winrate))
    return clamped
}

/* ── Mini circular progreso para WR col Negras / Blancas ── */
function MiniWinRateCircle({ value, color, label }: { value: number; color: string; label: string }) {
    const clamped = Math.max(0, Math.min(100, value))
    const dash = clamped * 1.256 // circumference ≈ 125.6 for r=20
    return (
        <div className="profile__mini-circle">
            <svg viewBox="0 0 44 44" className="profile__mini-svg">
                <circle cx="22" cy="22" r="18" className="profile__mini-track" />
                <circle
                    cx="22" cy="22" r="18"
                    className="profile__mini-fill"
                    style={{ stroke: color, strokeDasharray: `${dash} 113` }}
                />
            </svg>
            <span className="profile__mini-label">{value}%</span>
            <span className="profile__mini-sub">{label}</span>
        </div>
    )
}

function Profile({ onNavigate, userId, username }: ProfileProps) {
    const [stats, setStats] = useState<Stats | null>(null)
    const [h2h, setH2h] = useState<H2H | null>(null)
    const [history, setHistory] = useState<GameEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<ActiveTab>('resumen')

    // Ajustes de cuenta
    const [settingsForm, setSettingsForm] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
    const [settingsError, setSettingsError] = useState('')
    const [settingsSuccess, setSettingsSuccess] = useState('')
    const [savingSettings, setSavingSettings] = useState(false)

    // Privacidad
    const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public')

    const isOwnProfile = !userId

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true)
            setError('')
            try {
                const targetId = userId || 'me'
                const data = await api.users.getStats(targetId as any)
                setStats(data)
                setSettingsForm(f => ({ ...f, username: data.username || '' }))

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

    // ── Guardar ajustes de cuenta ──────────────────────────────────
    const handleSaveSettings = async () => {
        setSettingsError('')
        setSettingsSuccess('')
        if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
            setSettingsError('Las contraseñas nuevas no coinciden.')
            return
        }
        setSavingSettings(true)
        try {
            const updates: any = {}
            if (settingsForm.username && settingsForm.username !== stats?.username) updates.username = settingsForm.username
            if (settingsForm.email) updates.email = settingsForm.email
            if (settingsForm.newPassword) updates.password = settingsForm.newPassword
            if (Object.keys(updates).length === 0) { setSettingsSuccess('No hay cambios que guardar.'); setSavingSettings(false); return }
            await api.users.updateMe(updates)
            setSettingsSuccess('¡Ajustes guardados correctamente!')
            setStats(s => s ? { ...s, username: updates.username ?? s.username } : s)
        } catch (e: any) {
            setSettingsError(e.message || 'Error al guardar ajustes.')
        } finally {
            setSavingSettings(false)
        }
    }

    // ── Rendered tabs ──────────────────────────────────────────────
    // Perfil propio → 3 tabs (Resumen + Stats Pro + Ajustes)
    // Perfil de amigo → solo Resumen (Stats Pro usa 2ª persona: "tu némesis", etc.)
    const TABS: { key: ActiveTab; label: string; icon: string }[] = isOwnProfile
        ? [
            { key: 'resumen', label: 'Resumen', icon: '🏠' },
            { key: 'stats', label: 'Estadísticas Pro', icon: '📊' },
            { key: 'ajustes', label: 'Ajustes', icon: '⚙️' },
        ]
        : [
            { key: 'resumen', label: 'Resumen', icon: '🏠' },
        ]

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
                            <h1 className="profile__name">
                                {isOwnProfile ? '👤 Mi Hub' : displayName}
                            </h1>
                            {isOwnProfile && (
                                <span className="profile__hero-sub">@{displayName}</span>
                            )}
                            <div className="profile__elo-badge">
                                <span className="profile__elo-icon">🏆</span>
                                <span className="profile__elo-value">{stats?.elo ?? 1000} RR</span>
                                {stats?.peak_elo && (
                                    <span className="profile__peak-elo" title="Pico histórico de Elo">
                                        ↑ Pico: {stats.peak_elo}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── TABS ── */}
                    <nav className="profile__tabs">
                        {TABS.map(tab => (
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

                {/* ── CONTENIDO ── */}
                {loading ? (
                    <div className="profile__loading">
                        <div className="profile__spinner" />
                        <span>Cargando datos...</span>
                    </div>
                ) : error ? (
                    <div className="profile__error">{error}</div>
                ) : (
                    <>
                        {/* ══ TAB: RESUMEN ══ */}
                        {activeTab === 'resumen' && (
                            <div className="profile__body">
                                {/* ── SIDEBAR IZQ ── */}
                                <div className="profile__sidebar">
                                    {/* Win rate visual */}
                                    <div className="profile__card profile__card--winrate">
                                        <h3 className="profile__card-title">Win Rate Global</h3>
                                        <div className="profile__winrate-circle">
                                            <svg viewBox="0 0 80 80" className="profile__winrate-svg">
                                                <circle cx="40" cy="40" r="32" className="profile__winrate-track" />
                                                <circle
                                                    cx="40" cy="40" r="32"
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
                                        <h3 className="profile__card-title">📋 Estadísticas Globales</h3>
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

                                {/* ── HISTORIAL ── */}
                                <div className="profile__card profile__card--history">
                                    <h3 className="profile__card-title">🕹️ Últimas Partidas</h3>
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

                        {/* ══ TAB: ESTADÍSTICAS PRO ══ */}
                        {activeTab === 'stats' && (
                            <div className="profile__stats-pro">
                                {/* Fila 1: Pico Elo + Mejor Racha */}
                                <div className="profile__stats-row">
                                    <div className="profile__stat-card profile__stat-card--peak">
                                        <span className="profile__stat-card-icon">👑</span>
                                        <div className="profile__stat-card-body">
                                            <span className="profile__stat-card-label">Pico de RR</span>
                                            <span className="profile__stat-card-value">{stats?.peak_elo ?? stats?.elo ?? 1000}</span>
                                            <span className="profile__stat-card-hint">Máximo histórico</span>
                                        </div>
                                    </div>
                                    <div className="profile__stat-card profile__stat-card--streak">
                                        <span className="profile__stat-card-icon">🔥</span>
                                        <div className="profile__stat-card-body">
                                            <span className="profile__stat-card-label">Mejor Racha</span>
                                            <span className="profile__stat-card-value">{stats?.win_streak ?? 0}</span>
                                            <span className="profile__stat-card-hint">victorias seguidas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fila 2: WR Negras vs Blancas */}
                                <div className="profile__card">
                                    <h3 className="profile__card-title">♟️ Winrate por Color de Ficha</h3>
                                    <div className="profile__color-wr">
                                        <MiniWinRateCircle value={stats?.winrate_black ?? 0} color="#6d5dff" label="Negras" />
                                        <div className="profile__color-wr-divider">
                                            <span>vs</span>
                                        </div>
                                        <MiniWinRateCircle value={stats?.winrate_white ?? 0} color="#f0fafa" label="Blancas" />
                                    </div>
                                    <p className="profile__color-wr-hint">
                                        En Reversi, las negras mueven primero. ¿Eres mejor atacando o defendiendo?
                                    </p>
                                </div>

                                {/* Fila 3: Némesis y Víctima */}
                                <div className="profile__stats-row">
                                    <div className="profile__rival-card profile__rival-card--nemesis">
                                        <div className="profile__rival-badge">😈</div>
                                        <div className="profile__rival-body">
                                            <span className="profile__rival-role">Tu Némesis</span>
                                            <span className="profile__rival-name">
                                                {stats?.nemesis_name ?? '—'}
                                            </span>
                                            {stats?.nemesis_losses != null && stats.nemesis_losses > 0 && (
                                                <span className="profile__rival-info">
                                                    Te ha ganado <strong>{stats.nemesis_losses}</strong> veces
                                                </span>
                                            )}
                                            {!stats?.nemesis_name && (
                                                <span className="profile__rival-empty">Aún sin rival temido</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="profile__rival-card profile__rival-card--victim">
                                        <div className="profile__rival-badge">😇</div>
                                        <div className="profile__rival-body">
                                            <span className="profile__rival-role">Tu Víctima</span>
                                            <span className="profile__rival-name">
                                                {stats?.victim_name ?? '—'}
                                            </span>
                                            {stats?.victim_wins != null && stats.victim_wins > 0 && (
                                                <span className="profile__rival-info">
                                                    Le has ganado <strong>{stats.victim_wins}</strong> veces
                                                </span>
                                            )}
                                            {!stats?.victim_name && (
                                                <span className="profile__rival-empty">Aún sin víctima favorita</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Historial compacto */}
                                <div className="profile__card profile__card--history profile__card--history-compact">
                                    <h3 className="profile__card-title">📅 Últimas partidas</h3>
                                    <div className="profile__history-list">
                                        {history.length === 0 ? (
                                            <div className="profile__empty profile__empty--centered">
                                                <span className="profile__empty-icon">🎮</span>
                                                <span>No hay partidas recientes.</span>
                                            </div>
                                        ) : (
                                            history.slice(0, 5).map((game) => {
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
                                                            <span className="profile__game-opponent">vs {game.opponent_name || 'Alguien'}</span>
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

                        {/* ══ TAB: AJUSTES (solo perfil propio) ══ */}
                        {activeTab === 'ajustes' && isOwnProfile && (
                            <div className="profile__settings">
                                {/* Ajustes de cuenta */}
                                <div className="profile__card profile__settings-card">
                                    <h3 className="profile__card-title">👤 Ajustes de Cuenta</h3>
                                    <div className="profile__settings-form">
                                        <div className="profile__form-group">
                                            <label className="profile__form-label">Nombre de usuario</label>
                                            <input
                                                className="profile__form-input"
                                                type="text"
                                                value={settingsForm.username}
                                                onChange={e => setSettingsForm(f => ({ ...f, username: e.target.value }))}
                                                placeholder="Tu nombre de usuario"
                                            />
                                        </div>
                                        <div className="profile__form-group">
                                            <label className="profile__form-label">Email</label>
                                            <input
                                                className="profile__form-input"
                                                type="email"
                                                value={settingsForm.email}
                                                onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))}
                                                placeholder="tu@email.com"
                                            />
                                        </div>

                                        <div className="profile__form-divider">
                                            <span>Cambiar contraseña</span>
                                        </div>

                                        <div className="profile__form-group">
                                            <label className="profile__form-label">Contraseña actual</label>
                                            <input
                                                className="profile__form-input"
                                                type="password"
                                                value={settingsForm.currentPassword}
                                                onChange={e => setSettingsForm(f => ({ ...f, currentPassword: e.target.value }))}
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
                                                    onChange={e => setSettingsForm(f => ({ ...f, newPassword: e.target.value }))}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="profile__form-group">
                                                <label className="profile__form-label">Confirmar contraseña</label>
                                                <input
                                                    className="profile__form-input"
                                                    type="password"
                                                    value={settingsForm.confirmPassword}
                                                    onChange={e => setSettingsForm(f => ({ ...f, confirmPassword: e.target.value }))}
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

                                {/* Privacidad del perfil */}
                                <div className="profile__card profile__settings-card">
                                    <h3 className="profile__card-title">🔒 Privacidad del Perfil</h3>
                                    <p className="profile__settings-hint">¿Quién puede ver tus estadísticas e historial?</p>
                                    <div className="profile__privacy-options">
                                        {[
                                            { value: 'public', icon: '🌍', label: 'Público', desc: 'Todos pueden ver tu perfil' },
                                            { value: 'friends', icon: '👥', label: 'Solo amigos', desc: 'Solo tus amigos pueden verlo' },
                                            { value: 'private', icon: '🔒', label: 'Privado', desc: 'Nadie más puede verlo' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                className={`profile__privacy-btn${privacy === opt.value ? ' profile__privacy-btn--active' : ''}`}
                                                onClick={() => setPrivacy(opt.value as any)}
                                            >
                                                <span className="profile__privacy-icon">{opt.icon}</span>
                                                <div>
                                                    <span className="profile__privacy-label">{opt.label}</span>
                                                    <span className="profile__privacy-desc">{opt.desc}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ir a Personalización */}
                                <div className="profile__card profile__settings-card profile__settings-card--cta">
                                    <div className="profile__cta-content">
                                        <span className="profile__cta-icon">🎨</span>
                                        <div>
                                            <span className="profile__cta-title">Personalización</span>
                                            <span className="profile__cta-desc">Cambia tu avatar, color de ficha y color de tablero</span>
                                        </div>
                                    </div>
                                    <button
                                        className="profile__cta-btn"
                                        onClick={() => onNavigate('customization')}
                                    >
                                        Ir a Personalización →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
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