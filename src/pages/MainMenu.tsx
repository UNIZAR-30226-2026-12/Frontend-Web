import { useState, useEffect } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import { getAvatarFromSeed } from '../assets/avatarUtils'
import '../Background.css'
import './MainMenu.css'

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
    return (
        <div className="menu">
            {/* Barra de usuario y cierre de sesión */}
            <div className="menu__user-bar">
                <div className="menu__user-info">
                    <img className="menu__user-icon" src={getAvatarFromSeed(user?.username || 'Jugador')} alt="Avatar" />
                    <div className="menu__user-details">
                        <span className="menu__user-name">{user?.username || 'Cargando...'}</span>
                        <span className="menu__user-elo">{user ? `ELO: ${user.elo}` : ''}</span>
                    </div>
                </div>
                <button className="menu__logout-btn" onClick={handleLogout} title="Cerrar Sesión">
                    <span className="menu__logout-text">Cerrar Sesión</span>
                </button>
            </div>

            {/* Fondo animado con fichas flotantes */}
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
                {/* Logo / Título */}
                <div className="menu__header">
                    <h1 className="menu__title">
                        <span className="menu__title-random">Random</span>
                        <span className="menu__title-reversi">Reversi</span>
                    </h1>
                    <p className="menu__subtitle">¿Qué te apetece hacer hoy?</p>
                </div>

                {/* Opciones del menú */}
                <div className="menu__options">
                    <button className="menu__card" onClick={() => onNavigate('online-game')}>
                        <span className="menu__card-icon">🌐</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Jugar Online</span>
                            <span className="menu__card-desc">Compite contra otros jugadores en línea</span>
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
                            <span className="menu__card-desc">Personaliza tu perfil, fichas y tablero</span>
                        </div>
                    </button>

                    <button className="menu__card" onClick={() => onNavigate('friends')}>
                        <span className="menu__card-icon">👥</span>
                        <div className="menu__card-info">
                            <span className="menu__card-title">Amigos</span>
                            <span className="menu__card-desc">Gestiona tu lista de amigos</span>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <footer className="menu__footer">
                    <p>HuQ Games Studio &middot; Universidad de Zaragoza</p>
                </footer>
            </main>

            {/* Modales */}
            <GameModal
                isOpen={showIAModal}
                onClose={() => setShowIAModal(false)}
                title="Jugar contra la IA"
                subtitle="Elige el modo de juego"
                onSelectMode={(mode) => {
                    setShowIAModal(false)
                    onNavigate('waiting-room', {
                        mode,
                        playerName: user?.username || 'Jugador',
                        playerRR: user?.elo || 0,
                        opponentName: 'Bot_IA',
                        opponentRR: 1500,
                        returnTo: 'menu'
                    })
                }}
            />
        </div>
    )
}

export default MainMenu
