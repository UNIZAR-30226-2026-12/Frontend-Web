import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Home from '../pages/Home'
import MainMenu from '../pages/MainMenu'
import Rules from '../pages/Rules'
import Customization from '../pages/Customization'
import Friends from '../pages/Friends'
import Profile from '../pages/Profile'
import OnlineGame from '../pages/OnlineGame'
import Ranking from '../pages/Ranking'
import WaitingRoom from '../pages/WaitingRoom'
import GameBoard1v1 from '../pages/GameBoard1v1'
import GameBoard1v1v1v1 from '../pages/GameBoard1v1v1v1'
import { WS_BASE_URL } from '../services/api'
import '../styles/components/PopupGuide.css'

interface WaitingRoomData {
  gameId?: string | number
  playerName?: string
  playerRR?: number
  opponentName?: string
  opponentRR?: number
  opponentName2?: string
  opponentRR2?: number
  opponentName3?: string
  opponentRR3?: number
  isResume?: boolean
}

interface MatchData {
  online?: boolean
  gameId?: string
  playerName: string
  playerRR: number
  opponentName: string
  opponentRR: number
}

interface MatchData4Players {
  online?: boolean
  gameId?: string
  myUsername?: string
  players: Array<{
    id?: number
    name: string
    rr: number
    avatar_url?: string
  }>
}

const formatNotificationMode = (rawMode: string) => {
  const cleanedMode = String(rawMode || '').toLowerCase()
  if (cleanedMode.startsWith('1vs1vs1vs1') || cleanedMode.startsWith('1v1v1v1')) return '1vs1vs1vs1'
  return '1vs1'
}

const sanitizeNotificationMessage = (message: string) =>
  String(message || '').replace(/\b(1vs1vs1vs1|1v1v1v1|1vs1|1v1)(?:_skills)?\b/gi, (match) =>
    formatNotificationMode(match),
  )

function App() {
  const [currentScreen, setCurrentScreen] = useState(() => localStorage.getItem('currentScreen') || 'home')
  const [activeGameMode, setActiveGameMode] = useState<'1vs1' | '1vs1vs1vs1'>(() => (localStorage.getItem('activeGameMode') as any) || '1vs1')
  const [waitingRoomReturnScreen, setWaitingRoomReturnScreen] = useState(() => localStorage.getItem('waitingRoomReturnScreen') || 'online-game')
  const [waitingRoomData, setWaitingRoomData] = useState<WaitingRoomData>(() => JSON.parse(localStorage.getItem('waitingRoomData') || '{}'))
  const [activeMatchData, setActiveMatchData] = useState<MatchData | null>(() => JSON.parse(localStorage.getItem('activeMatchData') || 'null'))
  const [activeMatchData4Players, setActiveMatchData4Players] = useState<MatchData4Players | null>(() => JSON.parse(localStorage.getItem('activeMatchData4Players') || 'null'))
  const [profileData, setProfileData] = useState<{ userId?: number, username?: string, returnTo?: string }>(() => JSON.parse(localStorage.getItem('profileData') || '{}'))
  const [notification, setNotification] = useState<string | null>(null)
  const [homeLoginMessage, setHomeLoginMessage] = useState('')
  const [homeLoginMessageType, setHomeLoginMessageType] = useState<'success' | 'warning'>('success')
  const wsRef = useRef<WebSocket | null>(null)
  const notificationCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const notificationTitleId = 'popup-notification-title'
  const notificationDescriptionId = 'popup-notification-description'

  const wsNotificationsUrl = useMemo(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    return `${WS_BASE_URL}/ws/notifications?token=${encodeURIComponent(token)}`
  }, [currentScreen])

  useEffect(() => {
    if (!wsNotificationsUrl) return
    const ws = new WebSocket(wsNotificationsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === 'duel_invite' && data?.payload?.message) {
          setNotification(sanitizeNotificationMessage(data.payload.message))
        }
        if (data?.type === 'invite_response' && data?.payload?.message) {
          const action = data?.payload?.action
          const gameId = data?.payload?.game_id
          const currentRoomId = waitingRoomData.gameId?.toString()
          
          console.log(`NOTIF DEBUG: Action='${action}', GameId='${gameId}', CurrentRoom='${currentRoomId}', Screen='${currentScreen}'`)
          
          if (action !== 'accepted') {
            setNotification(sanitizeNotificationMessage(data.payload.message))
          }

          if ((action === 'room_closed' || action === 'kicked') && 
               currentScreen === 'waiting-room' && 
               currentRoomId === gameId?.toString()) {
            console.log("NOTIF DEBUG: Navigating away due to room_closed/kicked")
            navigateTo(waitingRoomReturnScreen)
          } else {
            console.log("NOTIF DEBUG: No navigation triggered")
          }
        }
      } catch {
        // Ignore malformed notifications
      }
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [currentScreen, waitingRoomData.gameId, wsNotificationsUrl])

  useEffect(() => {
    const titlesByScreen: Record<string, string> = {
      home: 'Inicio',
      menu: 'Menu principal',
      rules: 'Reglas',
      customization: 'Personalizacion',
      friends: 'Amigos',
      profile: 'Perfil',
      'online-game': 'Jugar online',
      ranking: 'Ranking',
      'waiting-room': 'Sala de espera',
      'game-1vs1': 'Partida 1 vs 1',
      'game-1v1v1v1': 'Partida 4 jugadores',
    }

    const screenTitle = titlesByScreen[currentScreen] || 'Random Reversi'
    document.title = `${screenTitle} | Random Reversi`
  }, [currentScreen])

  useEffect(() => {
    if (!notification) return

    const previousFocusedElement = document.activeElement as HTMLElement | null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setNotification(null)
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        notificationCloseButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => {
      notificationCloseButtonRef.current?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusedElement?.focus?.()
    }
  }, [notification])

  // Persistencia de estados críticos en cada cambio
  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen)
    localStorage.setItem('activeGameMode', activeGameMode)
    localStorage.setItem('waitingRoomReturnScreen', waitingRoomReturnScreen)
    localStorage.setItem('waitingRoomData', JSON.stringify(waitingRoomData))
    localStorage.setItem('activeMatchData', JSON.stringify(activeMatchData))
    localStorage.setItem('activeMatchData4Players', JSON.stringify(activeMatchData4Players))
    localStorage.setItem('profileData', JSON.stringify(profileData))
  }, [currentScreen, activeGameMode, waitingRoomReturnScreen, waitingRoomData, activeMatchData, activeMatchData4Players, profileData])

  const navigateTo = useCallback((screen: string, data?: any) => {
    console.log(`NAV DEBUG: Navigating to ${screen}`, data)
    if (screen === 'waiting-room') {
      if (data?.mode) {
        setActiveGameMode(data.mode)
      }
      setWaitingRoomReturnScreen(data?.returnTo ?? currentScreen)
      setWaitingRoomData({
        gameId: data?.gameId,
        playerName: data?.playerName,
        playerRR: data?.playerRR,
        opponentName: data?.opponentName,
        opponentRR: data?.opponentRR,
        opponentName2: data?.opponentName2,
        opponentRR2: data?.opponentRR2,
        opponentName3: data?.opponentName3,
        opponentRR3: data?.opponentRR3,
        isResume: data?.isResume || false,
      })
    }
    if (screen === 'game-1vs1' && data?.matchData) {
      setActiveMatchData(data.matchData)
    }
    if (screen === 'game-1v1v1v1' && data?.matchData) {
      setActiveMatchData4Players(data.matchData)
    }
    if (screen === 'profile') {
      setProfileData({ userId: data?.id, username: data?.name, returnTo: data?.returnTo })
    }
    if (screen === 'home' && data?.loginMessage) {
      setHomeLoginMessage(data.loginMessage)
      setHomeLoginMessageType(data.loginMessageType ?? 'warning')
    }
    setCurrentScreen(screen)
  }, [currentScreen])

  return (
    <>
      <a className="skip-link" href="#app-main">Saltar al contenido principal</a>

      <div id="app-main" tabIndex={-1}>
        {currentScreen === 'home' && <Home onNavigate={navigateTo} initialLoginMessage={homeLoginMessage} initialLoginMessageType={homeLoginMessageType} onLoginMessageShown={() => { setHomeLoginMessage(''); setHomeLoginMessageType('success') }} />}
        {currentScreen === 'menu' && <MainMenu onNavigate={navigateTo} />}
        {currentScreen === 'rules' && <Rules onNavigate={navigateTo} />}
        {currentScreen === 'customization' && <Customization onNavigate={navigateTo} />}
        {currentScreen === 'friends' && <Friends onNavigate={navigateTo} />}
        {currentScreen === 'profile' && <Profile onNavigate={navigateTo} userId={profileData.userId} username={profileData.username} returnTo={profileData.returnTo} />}
        {currentScreen === 'online-game' && <OnlineGame onNavigate={navigateTo} />}
        {currentScreen === 'ranking' && <Ranking onNavigate={navigateTo} />}
        {currentScreen === 'waiting-room' && (
          <WaitingRoom
            gameMode={activeGameMode}
            gameId={waitingRoomData.gameId}
            returnScreen={waitingRoomReturnScreen}
            isResume={waitingRoomData.isResume}
            onNavigate={navigateTo}
          />
        )}
        {currentScreen === 'game-1vs1' && <GameBoard1v1 onNavigate={navigateTo} matchData={activeMatchData} />}
        {currentScreen === 'game-1v1v1v1' && <GameBoard1v1v1v1 onNavigate={navigateTo} matchData={activeMatchData4Players} />}
      </div>

      {notification && (
        <div
          className="popup-notification-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={notificationTitleId}
          aria-describedby={notificationDescriptionId}
        >
          <div className="popup-notification-card" tabIndex={-1}>
            <div className="popup-notification-header">
              <span className="popup-notification-title" id={notificationTitleId}>NOTIFICACION</span>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="popup-notification-close"
                aria-label="Cerrar"
                ref={notificationCloseButtonRef}
              >
                x
              </button>
            </div>
            <p className="popup-notification-text" id={notificationDescriptionId}>{notification}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default App
