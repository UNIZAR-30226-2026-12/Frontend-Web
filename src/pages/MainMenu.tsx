import { useState, useEffect } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import { resolveUserAvatar } from '../config/avatarOptions'
import '../styles/background.css'
import '../styles/pages/MainMenu.css'

interface UserData {
    username: string
    elo: number
    avatar_url?: string
}

interface MainMenuProps {
    onNavigate: (screen: string, data?: any) => void
}

function MainMenu({ onNavigate }: MainMenuProps) {
    const [user, setUser] = useState<UserData | null>(null)
    const [showIAModal, setShowIAModal] = useState(false)
    const [isCreatingAI, setIsCreatingAI] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                onNavigate('home')
                return
            }

            try {
                const data = await api.users.getMe()
                setUser(data)
            } catch (err) {
                localStorage.removeItem('token')
                onNavigate('home')
            }
        }

        fetchUser()
    }, [onNavigate])

    const handleLogout = () => {
        localStorage.removeItem('token')
        onNavigate('home')
    }

    const handleSelectAIMode = async () => {
        if (isCreatingAI) return

        try {
            setIsCreatingAI(true)
            const res = await api.games.create('vs_ai')
            setShowIAModal(false)

            onNavigate('game-1vs1', {
                matchData: {
                    online: true,
                    gameId: String(res.game_id),
                    playerName: user?.username || 'Jugador',
                    playerRR: user?.elo ?? 1000,
                    playerAvatarUrl: user?.avatar_url,
                    opponentName: 'IA',
                    opponentRR: 1000,
                    returnTo: 'menu',
                },
            })
        } catch (error) {
            console.error('Error al crear partida contra IA', error)
            const message = error instanceof Error ? error.message : 'No se pudo crear la partida contra IA'
            window.alert(message)
        } finally {
            setIsCreatingAI(false)
        }
    }

    return (
        <div className="menu">
            <button
                className="menu__rules-btn"
                onClick={() => onNavigate('rules')}
                title="Ver reglas del juego"
            >
                <span className="menu__rules-icon">📘</span>
                <span className="menu__rules-text">Reglas</span>
            </button>

            <div className="menu__user-bar">
                <button
                    className="menu__user-info menu__user-info--clickable"
                    onClick={() => onNavigate('profile')}
                    title="Ver mi perfil"
                >
                    <img className="menu__user-icon" src={resolveUserAvatar(user?.avatar_url, user?.username || 'Jugador')} alt="Avatar" />
                    <div className="menu__user-details">
                        <span className="menu__user-name">{user?.username || 'Cargando...'}</span>
                        {user?.elo !== undefined && (
                            <span className="menu__user-elo">{user.elo} RR</span>
                        )}
                    </div>
                </button>
                <button className="menu__logout-btn" onClick={handleLogout} title="Cerrar sesión">
                    <span className="menu__logout-text">Cerrar sesión</span>
                </button>
            </div>

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

            <main className="menu__content">
                <div className="menu__header">
                    <h1 className="menu__title">
                        <span className="menu__title-random">Random</span>
                        <span className="menu__title-reversi">Reversi</span>
                    </h1>
                    <p className="menu__subtitle">¿Qué te apetece hacer hoy?</p>
                </div>

                <div className="menu__options">
                    <button className="menu__card" onClick={() => onNavigate('online-game')}>
                        <span className="menu__card-icon">🌐</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Jugar Online</span>
                            <span className="menu__card-desc">Compite contra otros jugadores en línea</span>
                        </div>
                    </button>

                    <button className="menu__card" onClick={() => onNavigate('ranking')}>
                        <span className="menu__card-icon">🏆</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Ranking Global</span>
                            <span className="menu__card-desc">Consulta el top de jugadores por RR</span>
                        </div>
                    </button>

                    <button className="menu__card" onClick={() => setShowIAModal(true)}>
                        <span className="menu__card-icon">🤖</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Jugar contra la IA</span>
                            <span className="menu__card-desc">Pon a prueba tu estrategia contra la máquina</span>
                        </div>
                    </button>

                    <button className="menu__card" onClick={() => onNavigate('customization')}>
                        <span className="menu__card-icon">🎨</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Personalización</span>
                            <span className="menu__card-desc">Personaliza tu perfil y estilos de fichas</span>
                        </div>
                    </button>

                    <button className="menu__card menu__card--wide" onClick={() => onNavigate('friends')}>
                        <span className="menu__card-icon">👥</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Amigos</span>
                            <span className="menu__card-desc">Gestiona tu lista de amigos</span>
                        </div>
                    </button>
                </div>

                <footer className="menu__footer">
                    <p>HuQ Games Studio &middot; Universidad de Zaragoza</p>
                </footer>
            </main>

            <GameModal
                isOpen={showIAModal}
                onClose={() => setShowIAModal(false)}
                title="Jugar contra la IA"
                subtitle="Selecciona el modo disponible contra IA"
                availableModes={['1vs1']}
                onSelectMode={handleSelectAIMode}
                isLoading={isCreatingAI}
            />
        </div>
    )
}

export default MainMenu
