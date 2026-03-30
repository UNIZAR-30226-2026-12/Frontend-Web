import { useEffect, useMemo, useRef, useState } from 'react'
import Home from '../pages/Home'
import MainMenu from '../pages/MainMenu'
import Rules from '../pages/Rules'
import Customization from '../pages/Customization'
import Friends from '../pages/Friends'
import Profile from '../pages/Profile'
import OnlineGame from '../pages/OnlineGame'
import WaitingRoom from '../pages/WaitingRoom'
import GameBoard1v1 from '../pages/GameBoard1v1'
import GameBoard1v1v1v1 from '../pages/GameBoard1v1v1v1'
import { WS_BASE_URL } from '../services/api'

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

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [activeGameMode, setActiveGameMode] = useState<'1vs1' | '1vs1vs1vs1'>('1vs1')
  const [waitingRoomReturnScreen, setWaitingRoomReturnScreen] = useState('online-game')
  const [waitingRoomData, setWaitingRoomData] = useState<WaitingRoomData>({})
  const [activeMatchData, setActiveMatchData] = useState<MatchData | null>(null)
  const [activeMatchData4Players, setActiveMatchData4Players] = useState<MatchData4Players | null>(null)
  const [profileData, setProfileData] = useState<{ userId?: number, username?: string }>({})
  const [notification, setNotification] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

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
          setNotification(data.payload.message)
        }
        if (data?.type === 'invite_response' && data?.payload?.message) {
          const action = data?.payload?.action
          if (action !== 'accepted') {
            setNotification(data.payload.message)
          }
          const gameId = data?.payload?.game_id
          if ((action === 'rejected' || action === 'left') && currentScreen === 'waiting-room' && waitingRoomData.gameId?.toString() === gameId?.toString()) {
            navigateTo('friends')
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

  const navigateTo = (screen: string, data?: any) => {
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
      })
    }
    if (screen === 'game-1vs1' && data?.matchData) {
      setActiveMatchData(data.matchData)
    }
    if (screen === 'game-1v1v1v1' && data?.matchData) {
      setActiveMatchData4Players(data.matchData)
    }
    if (screen === 'profile') {
      setProfileData({ userId: data?.id, username: data?.name })
    }
    setCurrentScreen(screen)
  }

  return (
    <>
      {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
      {currentScreen === 'menu' && <MainMenu onNavigate={navigateTo} />}
      {currentScreen === 'rules' && <Rules onNavigate={navigateTo} />}
      {currentScreen === 'customization' && <Customization onNavigate={navigateTo} />}
      {currentScreen === 'friends' && <Friends onNavigate={navigateTo} />}
      {currentScreen === 'profile' && <Profile onNavigate={navigateTo} userId={profileData.userId} username={profileData.username} />}
      {currentScreen === 'online-game' && <OnlineGame onNavigate={navigateTo} />}
      {currentScreen === 'waiting-room' && (
        <WaitingRoom
          gameMode={activeGameMode}
          gameId={waitingRoomData.gameId}
          returnScreen={waitingRoomReturnScreen}
          onNavigate={navigateTo}
        />
      )}
      {currentScreen === 'game-1vs1' && <GameBoard1v1 onNavigate={navigateTo} matchData={activeMatchData} />}
      {currentScreen === 'game-1v1v1v1' && <GameBoard1v1v1v1 onNavigate={navigateTo} matchData={activeMatchData4Players} />}

      {notification && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(2, 6, 23, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px',
        }}>
          <div style={{
            width: 'min(92vw, 520px)',
            background: '#101827',
            color: '#f5f5f5',
            border: '1px solid #2e3a4f',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.42)',
            fontSize: '15px',
            lineHeight: 1.4,
          }}>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{
                float: 'right',
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '18px',
                marginLeft: '8px',
              }}
              aria-label="Cerrar"
            >
              x
            </button>
            {notification}
          </div>
        </div>
      )}
    </>
  )
}

export default App
