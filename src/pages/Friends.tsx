import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from '../services/api'
import GameModal from '../components/GameModal'
import Modal from '../components/Modal'
import '../styles/pages/Friends.css'
import { resolveUserAvatar } from '../config/avatarOptions'
import friendsBackground from '../assets/backgrounds/menu-mosaic-bg.png'
import addFriendButtonImage from '../assets/amigos/botonA\u00F1adirAmigo.png'
import backToMenuButtonImage from '../assets/elementosGenerales/botonVolverMenu.png'
import friendsSheetImage from '../assets/amigos/listaAmigos.png'
import friendRequestsSheetImage from '../assets/amigos/solicitudesAmistad.png'
import gameRequestsSheetImage from '../assets/amigos/solicitudesJuego.png'
import pausedGamesSheetImage from '../assets/amigos/partidasPausadas.png'
import noFriendsIllustration from '../assets/amigos/SinAmigos.png'
import noFriendRequestsIllustration from '../assets/amigos/SinSolicitudes.png'
import noGameRequestsIllustration from '../assets/amigos/SinSolicitudesJuego.png'
import noPausedGamesIllustration from '../assets/amigos/sinPausadas.png'

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
    unread_count?: number
}

interface GameRequest {
    id: number
    lobby_id: number
    name: string
    avatar_url?: string
    rr: number
    gameMode: '1vs1' | '1vs1vs1vs1'
    playersCount?: number
}

interface PausedGame {
    game_id: number
    mode: '1vs1' | '1vs1vs1vs1'
    participants: string[]
    paused_by: string[]
    active_players: string[]
}

const normalizeMode = (rawMode: unknown): '1vs1' | '1vs1vs1vs1' => {
    const cleanedMode = String(rawMode || '').toLowerCase()
    if (cleanedMode.startsWith('1vs1vs1vs1') || cleanedMode.startsWith('1v1v1v1')) return '1vs1vs1vs1'
    return '1vs1'
}

const normalizeFriendStatus = (rawStatus: unknown): Friend['status'] => {
    const cleanedStatus = String(rawStatus || '').toLowerCase()
    if (cleanedStatus === 'online') return 'online'
    if (cleanedStatus === 'playing' || cleanedStatus === 'in_game' || cleanedStatus === 'in-game') return 'playing'
    return 'offline'
}

const friendStatusPriority: Record<Friend['status'], number> = {
    online: 0,
    playing: 1,
    offline: 2,
}

const friendStatusLabel: Record<Friend['status'], string> = {
    online: 'En linea',
    playing: 'Jugando',
    offline: 'Desconectado',
}

const toInitial = (name: string) => {
    const trimmed = name.trim()
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

interface Toast {
    message: string
    type: 'success' | 'info' | 'error'
    visible: boolean
}

interface ChatMessage {
    id: number
    sender_id: number
    sender_name: string
    receiver_id: number
    receiver_name: string
    message: string
    is_read: boolean
    created_at: string
}


function Friends({ onNavigate }: FriendsProps) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [requests, setRequests] = useState<Friend[]>([])
    const [gameRequests, setGameRequests] = useState<GameRequest[]>([])
    const [pausedGames, setPausedGames] = useState<PausedGame[]>([])
    const [newFriendName, setNewFriendName] = useState('')
    const [toast, setToast] = useState<Toast>({ message: '', type: 'info', visible: false })
    const [isGameModalOpen, setIsGameModalOpen] = useState(false)
    const [isGroupInviteModalOpen, setIsGroupInviteModalOpen] = useState(false)
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
    const [selectedExtraFriends, setSelectedExtraFriends] = useState<number[]>([])
    const [isChatModalOpen, setIsChatModalOpen] = useState(false)
    const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [chatSending, setChatSending] = useState(false)
    const toastTimer = useRef<number | null>(null)
    const chatListRef = useRef<HTMLDivElement | null>(null)

    const fetchFriends = async () => {
        try {
            const data = await api.friends.list()
            const normalizedFriends: Friend[] = (data.friends || []).map((friend: any) => ({
                ...friend,
                status: normalizeFriendStatus(friend.status),
                unread_count: Number(friend.unread_count || 0),
            }))
            setFriends(normalizedFriends)
            setRequests(data.requests || [])
            const normalizedGameRequests: GameRequest[] = (data.gameRequests || []).map((request: any) => ({
                id: request.id,
                lobby_id: request.lobby_id ?? request.lobbyId ?? request.id,
                name: request.name,
                avatar_url: request.avatar_url,
                rr: request.rr,
                gameMode: normalizeMode(request.gameMode ?? request.gamemode ?? request.mode),
                playersCount: request.playersCount,
            }))
            setGameRequests(normalizedGameRequests)
            setPausedGames(data.pausedGames || [])
        } catch (err) {
            showToast('Error al cargar amigos', 'error')
        }
    }

    const fetchChatMessages = async (
        friendId: number,
        options: { markAsRead?: boolean; silent?: boolean } = {}
    ) => {
        const { markAsRead = true, silent = false } = options
        if (!silent) setChatLoading(true)
        try {
            const response = await api.friends.getChat(friendId)
            setChatMessages(response.messages || [])
            if (markAsRead) {
                await api.friends.markChatRead(friendId)
                setFriends((prev) =>
                    prev.map((friend) =>
                        friend.id === friendId ? { ...friend, unread_count: 0 } : friend
                    )
                )
            }
        } catch (err: any) {
            if (!silent) showToast(err.message || 'Error al cargar chat', 'error')
        } finally {
            if (!silent) setChatLoading(false)
        }
    }

    useEffect(() => {
        fetchFriends()
        const refreshTimer = window.setInterval(fetchFriends, 5000)
        return () => {
            if (toastTimer.current) {
                window.clearTimeout(toastTimer.current)
            }
            window.clearInterval(refreshTimer)
        }
    }, [])

    useEffect(() => {
        if (!isChatModalOpen || !activeChatFriend) return

        const pollTimer = window.setInterval(() => {
            fetchChatMessages(activeChatFriend.id, { markAsRead: true, silent: true })
        }, 3000)

        return () => window.clearInterval(pollTimer)
    }, [isChatModalOpen, activeChatFriend])

    useEffect(() => {
        if (!isChatModalOpen || !chatListRef.current) return
        chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }, [chatMessages, isChatModalOpen])

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

    const handleAcceptGame = async (request: GameRequest) => {
        try {
            const response = await api.games.acceptInvite(request.lobby_id)
            setGameRequests(prev => prev.filter(r => r.lobby_id !== request.lobby_id))
            showToast(`Aceptando partida de ${request.name}. Preparando tablero...`, 'success')
            onNavigate('waiting-room', {
                mode: request.gameMode,
                gameId: response.game_id ?? request.lobby_id,
                returnTo: 'friends',
            })
        } catch (err: any) {
            showToast(err.message || 'No se pudo aceptar la invitacion', 'error')
        }
    }

    const handleRejectGame = async (request: GameRequest) => {
        try {
            await api.games.rejectInvite(request.lobby_id)
            setGameRequests(prev => prev.filter(r => r.lobby_id !== request.lobby_id))
            showToast(`Invitacion de ${request.name} rechazada`, 'error')
        } catch (err: any) {
            showToast(err.message || 'No se pudo rechazar la invitacion', 'error')
        }
    }

    const handleResumeGame = (pausedGame: PausedGame) => {
        onNavigate('waiting-room', {
            mode: pausedGame.mode,
            gameId: pausedGame.game_id,
            returnTo: 'friends',
            isResume: true
        })
    }

    const handleAbandonPausedGame = async (gameId: number) => {
        try {
            await api.games.leaveLobby(gameId)
            setPausedGames(prev => prev.filter(g => g.game_id !== gameId))
            showToast('Partida abandonada y eliminada', 'info')
        } catch (err: any) {
            showToast(err.message || 'Error al abandonar partida', 'error')
        }
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

    const sendInvite = async (mode: string, friendIds: number[]) => {
        const backendMode = mode
        const response = await api.games.invite(friendIds, backendMode)
        showToast(`Invitacion enviada`, 'info')
        onNavigate('waiting-room', {
            mode,
            gameId: response.game_id,
            returnTo: 'friends',
        })
    }

    const handleConfirmInvite = async (mode: string) => {
        if (!selectedFriend) return

        if (mode === '1vs1vs1vs1') {
            setIsGameModalOpen(false)
            setSelectedExtraFriends([])
            setIsGroupInviteModalOpen(true)
            return
        }

        try {
            setIsGameModalOpen(false)
            await sendInvite(mode, [selectedFriend.id])
        } catch {
            showToast('Error al invitar al amigo', 'error')
        }
    }

    const handleToggleExtraFriend = (friendId: number) => {
        setSelectedExtraFriends((prev) => {
            if (prev.includes(friendId)) return prev.filter((id) => id !== friendId)
            if (prev.length >= 2) return prev
            return [...prev, friendId]
        })
    }

    const handleConfirmGroupInvite = async () => {
        if (!selectedFriend) return
        if (selectedExtraFriends.length !== 2) {
            showToast('Selecciona exactamente 2 amigos mas', 'error')
            return
        }

        try {
            const friendIds = [selectedFriend.id, ...selectedExtraFriends]
            await sendInvite('1vs1vs1vs1', friendIds)
            setIsGroupInviteModalOpen(false)
        } catch {
            showToast('Error al enviar invitaciones', 'error')
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

    const handleOpenChat = async (friend: Friend) => {
        setActiveChatFriend(friend)
        setIsChatModalOpen(true)
        setChatInput('')
        await fetchChatMessages(friend.id, { markAsRead: true, silent: false })
    }

    const handleCloseChat = () => {
        setIsChatModalOpen(false)
        setActiveChatFriend(null)
        setChatMessages([])
        setChatInput('')
    }

    const handleSendChatMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const text = chatInput.trim()
        if (!activeChatFriend || !text || chatSending) return

        try {
            setChatSending(true)
            await api.friends.sendChatMessage(activeChatFriend.id, text)
            setChatInput('')
            await fetchChatMessages(activeChatFriend.id, { markAsRead: false, silent: true })
        } catch (err: any) {
            showToast(err.message || 'No se pudo enviar el mensaje', 'error')
        } finally {
            setChatSending(false)
        }
    }

    const handleOpenAddModal = () => {
        setIsAddFriendModalOpen(true)
    }

    const handleCloseAddModal = () => {
        setIsAddFriendModalOpen(false)
        setNewFriendName('')
    }

    const sortedFriends = useMemo(
        () =>
            [...friends].sort((left, right) => {
                const statusOrder = friendStatusPriority[left.status] - friendStatusPriority[right.status]
                if (statusOrder !== 0) return statusOrder
                return left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })
            }),
        [friends]
    )

    const groupInviteCandidates = sortedFriends.filter(friend => friend.id !== selectedFriend?.id)
    const navigateToProfile = (id: number, name: string) => onNavigate('profile', { id, name, returnTo: 'friends' })

    return (
        <div className="friends">
            <img className="friends__background" src={friendsBackground} alt="" aria-hidden="true" />
            <div className="friends__overlay" aria-hidden="true"></div>

            <div className="friends__container">
                <header className="friends__header">
                    <div className="friends__headline">
                        <h1 className="friends__title">Amigos</h1>
                        <p className="friends__subtitle">Conecta y juega con tus amigos</p>
                    </div>
                    <button
                        className="friends__image-btn friends__image-btn--add"
                        onClick={handleOpenAddModal}
                        aria-label="Anadir amigo"
                        title="Anadir amigo"
                    >
                        <img src={addFriendButtonImage} alt="" />
                    </button>
                </header>

                <div className="friends__content">
                    <section className="friends__section friends__section--friends">
                        <img className="friends__section-image" src={friendsSheetImage} alt="" aria-hidden="true" />
                        <div className="friends__section-inner">
                            <h2 className="friends__section-title">Tus Amigos ({friends.length})</h2>
                            <div className="friends__list">
                                {friends.length === 0 ? (
                                    <div className="friends__empty-state friends__empty-state--friends">
                                        <img
                                            className="friends__empty-illustration"
                                            src={noFriendsIllustration}
                                            alt="Parece que aun no tienes amigos. Usa el boton de arriba para anadir alguno."
                                        />
                                    </div>
                                ) : (
                                    sortedFriends.map(friend => (
                                        <div
                                            key={friend.id}
                                            className="friend-card friend-card--friend friend-card--clickable"
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
                                                <div className={`friend-card__avatar-ring ${friend.status === 'online' ? 'friend-card__avatar-ring--online' : ''}`}>
                                                    <img className="friend-card__avatar" src={resolveUserAvatar(friend.avatar_url, friend.name)} alt={`Avatar de ${friend.name}`} />
                                                </div>
                                                <div className="friend-card__details">
                                                    <div className="friend-card__name-row">
                                                        <span className="friend-card__name">{friend.name}</span>
                                                        <span className="friend-card__rr">{friend.rr} RR</span>
                                                    </div>
                                                    <p className={`friend-card__status friend-card__status--${friend.status}`}>
                                                        {friendStatusLabel[friend.status]}
                                                    </p>
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
                                                    className="friend-btn friend-btn--chat"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenChat(friend)
                                                    }}
                                                    title={`Chatear con ${friend.name}`}
                                                >
                                                    Chat
                                                    {!!friend.unread_count && friend.unread_count > 0 && (
                                                        <span className="friend-btn__badge">
                                                            {friend.unread_count > 99 ? '99+' : friend.unread_count}
                                                        </span>
                                                    )}
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
                        </div>
                    </section>

                    <section className="friends__section friends__section--requests">
                        <img className="friends__section-image" src={friendRequestsSheetImage} alt="" aria-hidden="true" />
                        <div className="friends__section-inner">
                            <h2 className="friends__section-title">Solicitudes de Amistad ({requests.length})</h2>
                            <div className="friends__requests-list">
                                {requests.length === 0 ? (
                                    <div className="friends__empty-state friends__empty-state--requests">
                                        <img
                                            className="friends__empty-illustration"
                                            src={noFriendRequestsIllustration}
                                            alt="Sin solicitudes de amistad"
                                        />
                                    </div>
                                ) : (
                                    requests.map(request => (
                                        <div key={request.id} className="friend-card friend-card--request">
                                            <div className="friend-card__info">
                                                <img className="friend-card__avatar" src={resolveUserAvatar(request.avatar_url, request.name)} alt={`Avatar de ${request.name}`} />
                                                <div className="friend-card__details">
                                                    <div className="friend-card__name-row">
                                                        <button
                                                            type="button"
                                                            className="friend-card__name friend-card__name--link"
                                                            onClick={() => onNavigate('profile', { id: request.id, name: request.name, returnTo: 'friends' })}
                                                        >
                                                            {request.name}
                                                        </button>
                                                        <span className="friend-card__rr">{request.rr} RR</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="friend-card__actions friend-card__actions--inline">
                                                <button
                                                    className="friend-btn friend-btn--accept"
                                                    onClick={() => handleAcceptRequest(request)}
                                                    title="Aceptar solicitud"
                                                >
                                                    Aceptar
                                                </button>
                                                <button
                                                    className="friend-btn friend-btn--reject"
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    title="Rechazar solicitud"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="friends__section friends__section--game-requests">
                        <img className="friends__section-image" src={gameRequestsSheetImage} alt="" aria-hidden="true" />
                        <div className="friends__section-inner">
                            <h2 className="friends__section-title">Solicitudes de Juego ({gameRequests.length})</h2>
                            <div className="friends__requests-list">
                                {gameRequests.length === 0 ? (
                                    <div className="friends__empty-state friends__empty-state--games">
                                        <img
                                            className="friends__empty-illustration"
                                            src={noGameRequestsIllustration}
                                            alt="Sin solicitudes de juego"
                                        />
                                    </div>
                                ) : (
                                    gameRequests.map(request => (
                                        <div key={request.lobby_id} className="friend-card friend-card--game-request">
                                            <div className="friend-card__info">
                                                <img className="friend-card__avatar" src={resolveUserAvatar(request.avatar_url, request.name)} alt={`Avatar de ${request.name}`} />
                                                <div className="friend-card__details">
                                                    <div className="friend-card__name-row">
                                                        <button
                                                            type="button"
                                                            className="friend-card__name friend-card__name--link"
                                                            onClick={() => onNavigate('profile', { id: request.id, name: request.name, returnTo: 'friends' })}
                                                        >
                                                            {request.name}
                                                        </button>
                                                        <span className="friend-card__rr">{request.rr} RR</span>
                                                    </div>
                                                    <p className="friend-card__invite-text">Te invita a una partida</p>
                                                    <div className="friend-card__game-info">
                                                        {request.playersCount !== undefined && (
                                                            <span className="friend-card__players-count">{request.playersCount}/4 jugadores</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="friend-card__actions friend-card__actions--inline">
                                                <button
                                                    className="friend-btn friend-btn--join"
                                                    onClick={() => handleAcceptGame(request)}
                                                    title="Unirse"
                                                >
                                                    Unirse
                                                </button>
                                                <button
                                                    className="friend-btn friend-btn--reject"
                                                    onClick={() => handleRejectGame(request)}
                                                    title="Rechazar"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                            <span className="friend-card__mode-tag friend-card__mode-tag--corner">{request.gameMode}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="friends__section friends__section--paused-games">
                        <img className="friends__section-image" src={pausedGamesSheetImage} alt="" aria-hidden="true" />
                        <div className="friends__section-inner">
                            <h2 className="friends__section-title">Partidas Pausadas ({pausedGames.length})</h2>
                            <div className="friends__paused-list">
                                {pausedGames.length === 0 ? (
                                    <div className="friends__empty-state friends__empty-state--paused">
                                        <img
                                            className="friends__empty-illustration"
                                            src={noPausedGamesIllustration}
                                            alt="No tienes partidas pausadas activas."
                                        />
                                    </div>
                                ) : (
                                    pausedGames.map(pg => {
                                        const participants = pg.participants.length > 0 ? pg.participants : pg.active_players
                                        const others = pg.active_players.filter((u) => !pg.paused_by.includes(u))
                                        const waitingText = others.length > 0
                                            ? `Esperando a ${others.join(', ')}`
                                            : 'No hay jugadores activos'

                                        return (
                                            <div key={pg.game_id} className="friend-card friend-card--paused">
                                                <div className="friend-card__info">
                                                    <div className="friend-card__details">
                                                        <div className="friend-card__name-row">
                                                            <span className="friend-card__name">Partida en pausa</span>
                                                        </div>
                                                        <div className="friend-card__participants">
                                                            {participants.slice(0, 4).map((name) => (
                                                                <span
                                                                    key={`${pg.game_id}-${name}`}
                                                                    className="friend-card__participant-avatar"
                                                                    title={name}
                                                                >
                                                                    {toInitial(name)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <p className="friend-card__waiting-text">{waitingText}</p>
                                                    </div>
                                                </div>
                                                <span className="friend-card__mode-tag friend-card__mode-tag--paused-corner">{pg.mode}</span>
                                                <div className="friend-card__actions friend-card__actions--inline">
                                                    <button
                                                        className="friend-btn friend-btn--resume"
                                                        onClick={() => handleResumeGame(pg)}
                                                        title="Reanudar partida"
                                                    >
                                                        Reanudar
                                                    </button>
                                                    <button
                                                        className="friend-btn friend-btn--abandon"
                                                        onClick={() => handleAbandonPausedGame(pg.game_id)}
                                                        title="Abandonar partida"
                                                    >
                                                        Abandonar
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="friends__footer">
                    <button
                        className="friends__image-btn friends__image-btn--back"
                        onClick={() => onNavigate('menu')}
                        aria-label="Volver al menu"
                        title="Volver al menu"
                    >
                        <img src={backToMenuButtonImage} alt="" />
                    </button>
                </footer>
            </div>

            <div className={`popup-toast popup-toast--${toast.type} ${toast.visible ? 'popup-toast--visible' : ''}`}>
                <span className="popup-toast__icon">
                    {toast.type === 'success' && 'OK'}
                    {toast.type === 'info' && 'i'}
                    {toast.type === 'error' && 'X'}
                </span>
                <span className="popup-toast__message">{toast.message}</span>
            </div>
            <Modal
                isOpen={isAddFriendModalOpen}
                onClose={handleCloseAddModal}
                maxWidth="500px"
                overlayClassName="popup-overlay"
                boxClassName="popup-box popup-box--compact"
                closeButtonClassName="popup-close"
            >
                <div className="friends-modal popup-surface">
                    <h3 className="friends-modal__title">Anadir nuevo amigo</h3>
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

            <Modal
                isOpen={isGroupInviteModalOpen}
                onClose={() => {
                    setIsGroupInviteModalOpen(false)
                    setSelectedExtraFriends([])
                }}
                maxWidth="560px"
                overlayClassName="popup-overlay"
                boxClassName="popup-box popup-box--compact"
                closeButtonClassName="popup-close"
            >
                <div className="friends-group-invite popup-surface">
                    <h3 className="friends-group-invite__title">Selecciona 2 amigos extra</h3>
                    <p className="friends-group-invite__subtitle">
                        Para iniciar 1vs1vs1vs1 con {selectedFriend?.name}, elige dos jugadores mas.
                    </p>

                    <div className="friends-group-invite__list">
                        {groupInviteCandidates.length === 0 && (
                            <p className="friends__empty">No hay amigos disponibles para completar la sala.</p>
                        )}
                        {groupInviteCandidates.map((friend) => {
                            const isSelected = selectedExtraFriends.includes(friend.id)
                            const isDisabled = !isSelected && selectedExtraFriends.length >= 2
                            return (
                                <button
                                    key={friend.id}
                                    type="button"
                                    className={`friends-group-invite__item ${isSelected ? 'friends-group-invite__item--selected' : ''}`}
                                    disabled={isDisabled}
                                    onClick={() => handleToggleExtraFriend(friend.id)}
                                >
                                    <img
                                        className="friends-group-invite__avatar"
                                        src={resolveUserAvatar(friend.avatar_url, friend.name)}
                                        alt={`Avatar de ${friend.name}`}
                                    />
                                    <span className="friends-group-invite__name">{friend.name}</span>
                                    <span className="friends-group-invite__rr">{friend.rr} RR</span>
                                </button>
                            )
                        })}
                    </div>

                    <button
                        type="button"
                        className="friends__add-btn"
                        onClick={handleConfirmGroupInvite}
                        disabled={selectedExtraFriends.length !== 2}
                    >
                        Invitar y crear sala
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isChatModalOpen}
                onClose={handleCloseChat}
                maxWidth="680px"
                overlayClassName="popup-overlay"
                boxClassName="popup-box popup-box--chat"
                closeButtonClassName="popup-close"
            >
                <div className="friends-chat popup-surface">
                    <div className="friends-chat__header">
                        <img
                            className="friends-chat__avatar"
                            src={resolveUserAvatar(activeChatFriend?.avatar_url, activeChatFriend?.name || 'Amigo')}
                            alt={`Avatar de ${activeChatFriend?.name || 'amigo'}`}
                        />
                        <div className="friends-chat__header-info">
                            <h3 className="friends-chat__title">Chat con {activeChatFriend?.name}</h3>
                            <p className="friends-chat__subtitle">Mensajes privados entre amigos</p>
                        </div>
                    </div>

                    <div className="friends-chat__messages" ref={chatListRef}>
                        {chatLoading ? (
                            <p className="friends__empty">Cargando mensajes...</p>
                        ) : chatMessages.length === 0 ? (
                            <p className="friends__empty">No hay mensajes aun. Empieza la conversacion.</p>
                        ) : (
                            chatMessages.map((msg) => {
                                const isMine = msg.sender_id !== activeChatFriend?.id
                                const time = new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                return (
                                    <div
                                        key={msg.id}
                                        className={`friends-chat__message ${isMine ? 'friends-chat__message--mine' : 'friends-chat__message--theirs'}`}
                                    >
                                        <p className="friends-chat__bubble">{msg.message}</p>
                                        <span className="friends-chat__time">{time}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <form className="friends-chat__composer" onSubmit={handleSendChatMessage}>
                        <input
                            type="text"
                            className="friends-chat__input"
                            placeholder="Escribe un mensaje..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            maxLength={1000}
                        />
                        <button type="submit" className="friends-chat__send-btn" disabled={chatSending || !chatInput.trim()}>
                            {chatSending ? 'Enviando...' : 'Enviar'}
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    )
}

export default Friends

