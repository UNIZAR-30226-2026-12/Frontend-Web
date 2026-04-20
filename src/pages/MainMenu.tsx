import { useState, useEffect } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import { resolveUserAvatar } from '../config/avatarOptions'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import logoReversi from '../assets/elementosGenerales/logoReversi.png'
import questionMark from '../assets/elementosGenerales/interrogante.png'
import rulesButton from '../assets/homeScreenMenu/botonReglas.png'
import onlineButton from '../assets/homeScreenMenu/botonJugarOnline.png'
import aiButton from '../assets/homeScreenMenu/botonJugarIA.png'
import customizationButton from '../assets/homeScreenMenu/botonPersonalizacion.png'
import friendsButton from '../assets/homeScreenMenu/botonAmigos.png'
import rankingButton from '../assets/homeScreenMenu/botonRanking.png'
import logoutSticker from '../assets/homeScreenMenu/cerrarSesion.png'
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

    const handleSelectAIMode = async (mode: '1vs1' | '1vs1vs1vs1') => {
        if (isCreatingAI) return

        try {
            setIsCreatingAI(true)
            setShowIAModal(false)

            if (mode === '1vs1') {
                const res = await api.games.create('vs_ai_skills')
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
                return
            }

            const res = await api.games.create('1vs1vs1vs1_skills')
            const gameId = String(res.game_id)

            await api.games.addBot(gameId)
            await api.games.addBot(gameId)
            await api.games.addBot(gameId)

            onNavigate('game-1v1v1v1', {
                matchData: {
                    online: true,
                    gameId,
                    myUsername: user?.username || 'Jugador',
                    players: [
                        {
                            id: 0,
                            name: user?.username || 'Jugador',
                            rr: user?.elo ?? 1000,
                            avatar_url: user?.avatar_url,
                        },
                        { id: -1, name: 'IA_1', rr: 1000, avatar_url: '' },
                        { id: -2, name: 'IA_2', rr: 1000, avatar_url: '' },
                        { id: -3, name: 'IA_3', rr: 1000, avatar_url: '' },
                    ],
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
            <img className="menu__background" src={menuBackground} alt="" aria-hidden="true" />
            <div className="menu__overlay" aria-hidden="true"></div>

            <div className="menu__question-layer" aria-hidden="true">
                <img className="menu__question menu__question--1" src={questionMark} alt="" />
                <img className="menu__question menu__question--2" src={questionMark} alt="" />
                <img className="menu__question menu__question--3" src={questionMark} alt="" />
                <img className="menu__question menu__question--4" src={questionMark} alt="" />
                <img className="menu__question menu__question--5" src={questionMark} alt="" />
                <img className="menu__question menu__question--6" src={questionMark} alt="" />
            </div>

            <nav className="menu__top-nav">
                <button className="menu__rules-btn" onClick={() => onNavigate('rules')} title="Ver reglas del juego" aria-label="Reglas del juego">
                    <img src={rulesButton} alt="" />
                </button>
            </nav>

            <div className="menu__account">
                <button
                    className="menu__profile-sticker"
                    onClick={() => onNavigate('profile')}
                    title="Ver mi perfil"
                    aria-label={`Ver perfil de ${user?.username || 'Jugador'}`}
                >
                    <span className="menu__tape menu__tape--left"></span>
                    <span className="menu__tape menu__tape--right"></span>
                    <div className="menu__profile-frame">
                        <img
                            className="menu__profile-avatar"
                            src={resolveUserAvatar(user?.avatar_url, user?.username || 'Jugador')}
                            alt="Avatar"
                        />
                    </div>
                    <span className="menu__profile-elo">{user?.elo ?? 1000} RR</span>
                </button>

                <button className="menu__logout-btn" onClick={handleLogout} title="Cerrar sesion" aria-label="Cerrar sesion">
                    <img src={logoutSticker} alt="" />
                </button>
            </div>

            <main className="menu__stage">
                <h1 className="sr-only">Menu principal</h1>
                <div className="menu__header">
                    <img className="menu__logo" src={logoReversi} alt="Random Reversi" />
                    <p className="menu__subtitle">Elige tu jugada</p>
                </div>

                <div className="menu__center-layout">
                    <div className="menu__primary-row">
                        <button className="menu__image-btn menu__image-btn--online" onClick={() => onNavigate('online-game')} aria-label="Jugar online">
                            <img src={onlineButton} alt="" />
                        </button>

                        <button className="menu__image-btn menu__image-btn--ia" onClick={() => setShowIAModal(true)} aria-label="Jugar contra la IA">
                            <img src={aiButton} alt="" />
                        </button>
                    </div>

                    <div className="menu__secondary-row">
                        <button className="menu__image-btn menu__image-btn--custom" onClick={() => onNavigate('customization')} aria-label="Personalizacion">
                            <img src={customizationButton} alt="" />
                        </button>

                        <button className="menu__image-btn menu__image-btn--ranking" onClick={() => onNavigate('ranking')} aria-label="Ranking global">
                            <img src={rankingButton} alt="" />
                        </button>
                    </div>

                    <button className="menu__image-btn menu__image-btn--friends" onClick={() => onNavigate('friends')} aria-label="Amigos">
                        <img src={friendsButton} alt="" />
                    </button>
                </div>
            </main>

            <GameModal
                isOpen={showIAModal}
                onClose={() => setShowIAModal(false)}
                title="Jugar contra la IA"
                subtitle="Selecciona el modo disponible contra IA"
                availableModes={['1vs1', '1vs1vs1vs1']}
                onSelectMode={handleSelectAIMode}
                isLoading={isCreatingAI}
            />
        </div>
    )
}

export default MainMenu


