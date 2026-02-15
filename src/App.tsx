import { useState } from 'react'
import Home from './pages/Home'
import MainMenu from './pages/MainMenu'
import Customization from './pages/Customization'
import Friends from './pages/Friends'
import OnlineGame from './pages/OnlineGame'
import WaitingRoom from './pages/WaitingRoom'
import GameBoard1v1 from './pages/GameBoard1v1'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [activeGameMode, setActiveGameMode] = useState<'1vs1' | '1vs1vs1vs1'>('1vs1')
  const [waitingRoomReturnScreen, setWaitingRoomReturnScreen] = useState('online-game')

  const navigateTo = (screen: string, data?: any) => {
    if (screen === 'waiting-room') {
      if (data?.mode) {
        setActiveGameMode(data.mode)
      }
      setWaitingRoomReturnScreen(data?.returnTo ?? currentScreen)
    }
    setCurrentScreen(screen)
  }

  return (
    <>
      {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
      {currentScreen === 'menu' && <MainMenu onNavigate={navigateTo} />}
      {currentScreen === 'customization' && <Customization onNavigate={navigateTo} />}
      {currentScreen === 'friends' && <Friends onNavigate={navigateTo} />}
      {currentScreen === 'online-game' && <OnlineGame onNavigate={navigateTo} />}
      {currentScreen === 'waiting-room' && (
        <WaitingRoom gameMode={activeGameMode} returnScreen={waitingRoomReturnScreen} onNavigate={navigateTo} />
      )}
      {currentScreen === 'game-1vs1' && <GameBoard1v1 onNavigate={navigateTo} />}
    </>
  )
}

export default App
