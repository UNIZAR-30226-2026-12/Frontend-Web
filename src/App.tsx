import { useState } from 'react'
import Home from './pages/Home'
import MainMenu from './pages/MainMenu'
import Customization from './pages/Customization'
import Friends from './pages/Friends'
import OnlineGame from './pages/OnlineGame'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen)
  }

  return (
    <>
      {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
      {currentScreen === 'menu' && <MainMenu onNavigate={navigateTo} />}
      {currentScreen === 'customization' && <Customization onNavigate={navigateTo} />}
      {currentScreen === 'friends' && <Friends onNavigate={navigateTo} />}
      {currentScreen === 'online-game' && <OnlineGame onNavigate={navigateTo} />}
    </>
  )
}

export default App
