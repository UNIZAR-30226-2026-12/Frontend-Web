import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import Modal from '../components/Modal'
import '../styles/background.css'
import '../styles/pages/Friends.css'
import { resolveUserAvatar } from '../config/avatarOptions'

interface FriendsProps {
    onNavigate: (screen: string, data?: any) => void
}

interface Friend {
    id: number
    name: string
    avatar_url?: string
    status: 'online' | 'offline' | 'playing'
    rr: number
    gameMode?: '1vs1' | '1vs1vs1vs1'
    playersCount?: number
}

interface Toast {
    message: string
    type: 'success' | 'info' | 'error'
    visible: boolean
}


function Friends({ onNavigate }: FriendsProps) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [requests, setRequests] = useState<Friend[]>([])
    const [gameRequests, setGameRequests] = useState<any[]>([])
    const [newFriendName, setNewFriendName] = useState('')
    const [toast, setToast] = useState<Toast>({ message: '', type: 'info', visible: false })
    const [isGameModalOpen, setIsGameModalOpen] = useState(false)
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
    const toastTimer = useRef<number | null>(null)

    const fetchFriends = async () => {
        try {
            const data = await api.friends.list()
            setFriends(data.friends || [])
            setRequests(data.requests || [])
            setGameRequests(data.gameRequests || [])
        } catch (err) {
            showToast('Error al cargar amigos', 'error')
        }
    }

    useEffect(() => {
        fetchFriends()
        return () => {
            if (toastTimer.current) {
                window.clearTimeout(toastTimer.current)
            }
        }
    }, [])

    const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current)

        setToast({ message, type, visible: true })

        toastTimer.current = window.setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }))
            toastTimer.current = null
        }, 3000)
    }

    const handleAcceptRequest = async (request: Friend) => {
        try {
            await api.friends.acceptRequest(request.id)
            setRequests(requests.filter(r => r.id !== request.id))
            setFriends([...friends, { ...request, status: 'online' }])
            showToast(`Ahora eres amigo de ${request.name}!`, 'success')
        } catch (err) {
            showToast('No se pudo aceptar la solicitud', 'error')
        }
    }

    const handleRejectRequest = async (id: number) => {
        try {
            await api.friends.rejectRequest(id)
            const request = requests.find(r => r.id === id)
            setRequests(requests.filter(r => r.id !== id))
            if (request) showToast(`Solicitud de ${request.name} rechazada`, 'error')
        } catch (err) {
            showToast('Error al rechazar solicitud', 'error')
        }
    }

    const handleAcceptGame = (request: Friend) => {
        setGameRequests(gameRequests.filter(r => r.id !== request.id))
        showToast(`Aceptando partida de ${request.name}. Preparando tablero...`, 'success')
        onNavigate('waiting-room', { mode: request.gameMode })
    }

    const handleRejectGame = (id: number) => {
        const request = gameRequests.find(r => r.id === id)
        setGameRequests(gameRequests.filter(r => r.id !== id))
        if (request) showToast(`Invitacion de ${request.name} rechazada`, 'error')
    }

    const handleAddFriend = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const trimmedName = newFriendName.trim()

        if (!trimmedName) {
            showToast('Escribe un nombre de usuario', 'error')
            return
        }

        const alreadyFriend = friends.some(friend => friend.name.toLowerCase() === trimmedName.toLowerCase())
        if (alreadyFriend) {
            showToast(`${trimmedName} ya esta en tu lista`, 'error')
            return
        }

        try {
            await api.friends.sendRequest(trimmedName)
            showToast(`Solicitud enviada a ${trimmedName}`, 'info')
            setNewFriendName('')
            setIsAddFriendModalOpen(false)
        } catch (err: any) {
            showToast(err.message || 'Error al enviar solicitud', 'error')
        }
    }

    const handleInvite = (friend: Friend) => {
        setSelectedFriend(friend)
        setIsGameModalOpen(true)
    }

    const handleConfirmInvite = async (mode: string) => {
        if (!selectedFriend) return
        try {
            await api.games.invite(selectedFriend.id, mode)
            setIsGameModalOpen(false)
            showToast(`Invitacion enviada a ${selectedFriend.name}`, 'info')
            onNavigate('waiting-room', { mode })
        } catch (err) {
            showToast('Error al invitar al amigo', 'error')
        }
    }

    const handleRemove = async (id: number) => {
        try {
            await api.friends.remove(id)
            const friend = friends.find(f => f.id === id)
            setFriends(friends.filter(f => f.id !== id))
            if (friend) showToast(`${friend.name} eliminado de tus amigos`, 'error')
        } catch (err) {
            showToast('Error al eliminar amigo', 'error')
        }
    }

    const handleOpenAddModal = () => {
        setIsAddFriendModalOpen(true)
    }

    const handleCloseAddModal = () => {
        setIsAddFriendModalOpen(false)
        setNewFriendName('')
    }

    const onlineCount = friends.filter(friend => friend.status === 'online').length
    const playingCount = friends.filter(friend => friend.status === 'playing').length
    const navigateToProfile = (id: number, name: string) => onNavigate('profile', { id, name })

    return (
        <div className="friends">
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
                    <div className="friends__headline">
                        <div>
                            <h1 className="friends__title">Amigos</h1>
                            <p className="friends__subtitle">Conecta y juega con tus amigos</p>
                        </div>
                        <button className="friends__primary-btn" onClick={handleOpenAddModal}>
                            Añadir amigo
                        </button>
                    </div>
                    <div className="friends__stats">
                        <div className="friends__stat-card">
                            <span className="friends__stat-label">Total</span>
                            <strong className="friends__stat-value">{friends.length}</strong>
                        </div>
                        <div className="friends__stat-card">
                            <span className="friends__stat-label">En linea</span>
                            <strong className="friends__stat-value friends__stat-value--online">{onlineCount}</strong>
                        </div>
                        <div className="friends__stat-card">
                            <span className="friends__stat-label">Jugando</span>
                            <strong className="friends__stat-value friends__stat-value--playing">{playingCount}</strong>
                        </div>
                    </div>
                </header>

                <div className="friends__content">
                    <section className="friends__section friends__list-section">
                        <h2 className="friends__section-title">Tus amigos ({friends.length})</h2>
                        <div className="friends__list">
                            {friends.length === 0 ? (
                                <p className="friends__empty">No tienes amigos agregados todavia.</p>
                            ) : (
                                friends.map(friend => (
                                    <div
                                        key={friend.id}
                                        className="friend-card friend-card--clickable"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigateToProfile(friend.id, friend.name)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                navigateToProfile(friend.id, friend.name)
                                            }
                                        }}
                                    >
                                        <div className="friend-card__info">
                                            <img className="friend-card__avatar" src={resolveUserAvatar(friend.avatar_url, friend.name)} alt={`Avatar de ${friend.name}`} />
                                            <div className="friend-card__details">
                                                <div className="friend-card__name-row">
                                                    <span
                                                        className="friend-card__name"
                                                    >
                                                        {friend.name}
                                                    </span>
                                                    <span className="friend-card__rr">{friend.rr} RR</span>
                                                </div>
                                                <span className={`friend-card__status friend-card__status--${friend.status}`}>
                                                    {friend.status === 'online' && 'En linea'}
                                                    {friend.status === 'offline' && 'Desconectado'}
                                                    {friend.status === 'playing' && 'Jugando'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="friend-card__actions">
                                            <button
                                                className="friend-btn friend-btn--invite"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleInvite(friend)
                                                }}
                                                disabled={friend.status === 'offline'}
                                                title="Invitar a jugar"
                                            >
                                                Duelo
                                            </button>
                                            <button
                                                className="friend-btn friend-btn--remove"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRemove(friend.id)
                                                }}
                                                title="Eliminar amigo"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="friends__section friends__requests-section">
                        <h2 className="friends__section-title">Solicitudes de amistad ({requests.length})</h2>
                        <div className="friends__requests-list">
                            {requests.length === 0 ? (
                                <p className="friends__empty">Sin solicitudes de amistad</p>
                            ) : (
                                requests.map(request => (
                                    <div key={request.id} className="friend-card friend-card--request">
                                        <div className="friend-card__info">
                                            <img className="friend-card__avatar" src={resolveUserAvatar(request.avatar_url, request.name)} alt={`Avatar de ${request.name}`} />
                                            <div className="friend-card__details">
                                                <div className="friend-card__name-row">
                                                    <span
                                                        className="friend-card__name"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => onNavigate('profile', { id: request.id, name: request.name })}
                                                    >
                                                        {request.name}
                                                    </span>
                                                    <span className="friend-card__rr">{request.rr} RR</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="friend-card__actions friend-card__actions--inline">
                                            <button
                                                className="friend-btn friend-btn--accept"
                                                onClick={() => handleAcceptRequest(request)}
                                                title="Aceptar"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                className="friend-btn friend-btn--reject"
                                                onClick={() => handleRejectRequest(request.id)}
                                                title="Rechazar"
                                            >
                                                X
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="friends__section friends__game-requests-section">
                        <h2 className="friends__section-title">Solicitudes de juego ({gameRequests.length})</h2>
                        <div className="friends__requests-list">
                            {gameRequests.length === 0 ? (
                                <p className="friends__empty">Sin solicitudes de juego</p>
                            ) : (
                                gameRequests.map(request => (
                                    <div key={request.id} className="friend-card friend-card--game-request">
                                        <div className="friend-card__info">
                                            <img className="friend-card__avatar" src={resolveUserAvatar(request.avatar_url, request.name)} alt={`Avatar de ${request.name}`} />
                                            <div className="friend-card__details">
                                                <div className="friend-card__name-row">
                                                    <span
                                                        className="friend-card__name"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => onNavigate('profile', { id: request.id, name: request.name })}
                                                    >
                                                        {request.name}
                                                    </span>
                                                    <span className="friend-card__rr">{request.rr} RR</span>
                                                </div>
                                                <div className="friend-card__game-info">
                                                    <span className="friend-card__mode-tag">{request.gameMode}</span>
                                                    {request.playersCount !== undefined && (
                                                        <span className="friend-card__players-count">{request.playersCount}/4</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="friend-card__actions friend-card__actions--inline">
                                            <button
                                                className="friend-btn friend-btn--accept"
                                                onClick={() => handleAcceptGame(request)}
                                                title="Aceptar duelo"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                className="friend-btn friend-btn--reject"
                                                onClick={() => handleRejectGame(request.id)}
                                                title="Rechazar"
                                            >
                                                X
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <button className="friends__back-btn" onClick={() => onNavigate('menu')}>
                    Volver al menu
                </button>
            </div>

            <div className={`toast toast--${toast.type} ${toast.visible ? 'toast--visible' : ''}`}>
                <span className="toast__icon">
                    {toast.type === 'success' && 'OK'}
                    {toast.type === 'info' && 'i'}
                    {toast.type === 'error' && 'X'}
                </span>
                <span className="toast__message">{toast.message}</span>
            </div>

            <Modal isOpen={isAddFriendModalOpen} onClose={handleCloseAddModal} maxWidth="500px">
                <div className="friends-modal">
                    <h3 className="friends-modal__title">Añadir nuevo amigo</h3>
                    <p className="friends-modal__subtitle">Escribe su nombre de usuario para enviarle una solicitud de amistad</p>
                    <form className="friends-modal__form" onSubmit={handleAddFriend}>
                        <input
                            type="text"
                            className="friends__input"
                            placeholder="Nombre de usuario"
                            value={newFriendName}
                            onChange={(e) => setNewFriendName(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="friends__add-btn">
                            Enviar solicitud
                        </button>
                    </form>
                </div>
            </Modal>

            <GameModal
                isOpen={isGameModalOpen}
                onClose={() => setIsGameModalOpen(false)}
                title="Retar a un duelo"
                subtitle={`Que modo de juego quieres jugar contra ${selectedFriend?.name}?`}
                onSelectMode={handleConfirmInvite}
            />
        </div>
    )
}

export default Friends
