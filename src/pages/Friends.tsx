import { useState, useRef } from 'react'
import '../Background.css'
import './Friends.css'

interface FriendsProps {
    onNavigate: (screen: string) => void
}

interface Friend {
    id: number
    name: string
    status: 'online' | 'offline' | 'playing'
    avatar: string
}

interface Toast {
    message: string
    type: 'success' | 'info' | 'error'
    visible: boolean
}

const MOCK_FRIENDS: Friend[] = [
    { id: 1, name: 'CyberNinja', status: 'online', avatar: '🥷' },
    { id: 2, name: 'ReversiMaster', status: 'playing', avatar: '🦊' },
    { id: 3, name: 'StarPlayer99', status: 'offline', avatar: '⭐' },
    { id: 4, name: 'RoboTactics', status: 'online', avatar: '🤖' },
]

const MOCK_REQUESTS: Friend[] = [
    { id: 101, name: 'GamerX', status: 'offline', avatar: '🎮' },
    { id: 102, name: 'PixelArtist', status: 'offline', avatar: '🎨' },
]

const MOCK_GAME_REQUESTS: Friend[] = [
    { id: 201, name: 'ProPlayer_01', status: 'online', avatar: '🕹️' },
]

function Friends({ onNavigate }: FriendsProps) {
    const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS)
    const [requests, setRequests] = useState<Friend[]>(MOCK_REQUESTS)
    const [gameRequests, setGameRequests] = useState<Friend[]>(MOCK_GAME_REQUESTS)
    const [newFriendName, setNewFriendName] = useState('')
    const [toast, setToast] = useState<Toast>({ message: '', type: 'info', visible: false })
    const toastTimer = useRef<number | null>(null)

    const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current)

        setToast({ message, type, visible: true })

        toastTimer.current = window.setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }))
            toastTimer.current = null
        }, 3000)
    }

    const handleAcceptRequest = (request: Friend) => {
        setRequests(requests.filter(r => r.id !== request.id))
        setFriends([...friends, { ...request, status: 'online' }])
        showToast(`¡Ahora eres amigo de ${request.name}!`, 'success')
    }

    const handleRejectRequest = (id: number) => {
        const request = requests.find(r => r.id === id)
        setRequests(requests.filter(r => r.id !== id))
        if (request) showToast(`Solicitud de ${request.name} rechazada`, 'error')
    }

    const handleAcceptGame = (request: Friend) => {
        setGameRequests(gameRequests.filter(r => r.id !== request.id))
        showToast(`¡Aceptando partida de ${request.name}! Preparando tablero...`, 'success')
    }

    const handleRejectGame = (id: number) => {
        const request = gameRequests.find(r => r.id === id)
        setGameRequests(gameRequests.filter(r => r.id !== id))
        if (request) showToast(`Invitación de ${request.name} rechazada`, 'info')
    }

    const handleAddFriend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFriendName.trim()) return

        const newFriend: Friend = {
            id: Date.now(),
            name: newFriendName,
            status: 'offline',
            avatar: '👤'
        }

        setFriends([...friends, newFriend])
        showToast(`Solicitud enviada a ${newFriendName}`, 'info')
        setNewFriendName('')
    }

    const handleInvite = (friendName: string) => {
        showToast(`Invitación enviada a ${friendName}`, 'info')
    }

    const handleRemove = (id: number) => {
        const friend = friends.find(f => f.id === id)
        setFriends(friends.filter(f => f.id !== id))
        if (friend) showToast(`${friend.name} eliminado de tus amigos`, 'error')
    }

    return (
        <div className="friends">
            {/* Fondo animado compartido */}
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

            <div className="friends__container">
                <header className="friends__header">
                    <h1 className="friends__title">Amigos</h1>
                    <p className="friends__subtitle">Conecta y juega con tus compañeros</p>
                </header>

                <div className="friends__content">
                    {/* Sección: Lista de Amigos */}
                    <div className="friends__section friends__list-section">
                        <h2 className="friends__section-title">Tus Amigos ({friends.length})</h2>
                        <div className="friends__list">
                            {friends.length === 0 ? (
                                <p className="friends__empty">No tienes amigos agregados todavía.</p>
                            ) : (
                                friends.map(friend => (
                                    <div key={friend.id} className="friend-card">
                                        <div className="friend-card__info">
                                            <span className="friend-card__avatar">{friend.avatar}</span>
                                            <div className="friend-card__details">
                                                <span className="friend-card__name">{friend.name}</span>
                                                <span className={`friend-card__status friend-card__status--${friend.status}`}>
                                                    {friend.status === 'online' && 'En línea'}
                                                    {friend.status === 'offline' && 'Desconectado'}
                                                    {friend.status === 'playing' && 'Jugando'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="friend-card__actions">
                                            <button
                                                className="friend-btn friend-btn--invite"
                                                onClick={() => handleInvite(friend.name)}
                                                disabled={friend.status === 'offline'}
                                                title="Invitar a jugar"
                                            >
                                                ⚔️
                                            </button>
                                            <button
                                                className="friend-btn friend-btn--remove"
                                                onClick={() => handleRemove(friend.id)}
                                                title="Eliminar amigo"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sección: Añadir Amigo */}
                    <div className="friends__section friends__add-section">
                        <h2 className="friends__section-title">Añadir Amigo</h2>
                        <form className="friends__add-form" onSubmit={handleAddFriend}>
                            <input
                                type="text"
                                className="friends__input"
                                placeholder="Nombre de usuario..."
                                value={newFriendName}
                                onChange={(e) => setNewFriendName(e.target.value)}
                            />
                            <button type="submit" className="friends__add-btn">
                                Enviar Solicitud
                            </button>
                        </form>
                    </div>

                    {/* Sección: Solicitudes de Amistad */}
                    <div className="friends__section friends__requests-section">
                        <h2 className="friends__section-title">Solicitudes de Amistad ({requests.length})</h2>
                        <div className="friends__requests-list">
                            {requests.length === 0 ? (
                                <p className="friends__empty">Sin solicitudes de amistad</p>
                            ) : (
                                requests.map(request => (
                                    <div key={request.id} className="friend-card friend-card--request">
                                        <div className="friend-card__info">
                                            <span className="friend-card__avatar">{request.avatar}</span>
                                            <span className="friend-card__name">{request.name}</span>
                                        </div>
                                        <div className="friend-card__actions">
                                            <button
                                                className="friend-btn friend-btn--accept"
                                                onClick={() => handleAcceptRequest(request)}
                                                title="Aceptar"
                                            >
                                                ✅
                                            </button>
                                            <button
                                                className="friend-btn friend-btn--reject"
                                                onClick={() => handleRejectRequest(request.id)}
                                                title="Rechazar"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sección: Solicitudes de Juego */}
                    <div className="friends__section friends__game-requests-section">
                        <h2 className="friends__section-title">Solicitudes de Juego ({gameRequests.length})</h2>
                        <div className="friends__requests-list">
                            {gameRequests.length === 0 ? (
                                <p className="friends__empty">Sin solicitudes de juego</p>
                            ) : (
                                gameRequests.map(request => (
                                    <div key={request.id} className="friend-card friend-card--request">
                                        <div className="friend-card__info">
                                            <span className="friend-card__avatar">{request.avatar}</span>
                                            <span className="friend-card__name">{request.name}</span>
                                        </div>
                                        <div className="friend-card__actions">
                                            <button
                                                className="friend-btn friend-btn--accept"
                                                onClick={() => handleAcceptGame(request)}
                                                title="Aceptar Duelo"
                                            >
                                                ✅
                                            </button>
                                            <button
                                                className="friend-btn friend-btn--reject"
                                                onClick={() => handleRejectGame(request.id)}
                                                title="Rechazar"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <button className="friends__back-btn" onClick={() => onNavigate('menu')}>
                    Volver al menú
                </button>
            </div>

            {/* Sistema de Notificaciones (Toasts) */}
            <div className={`toast toast--${toast.type} ${toast.visible ? 'toast--visible' : ''}`}>
                <span className="toast__icon">
                    {toast.type === 'success' && '✅'}
                    {toast.type === 'info' && '🔔'}
                    {toast.type === 'error' && '❌'}
                </span>
                <span className="toast__message">{toast.message}</span>
            </div>
        </div>
    )
}

export default Friends
