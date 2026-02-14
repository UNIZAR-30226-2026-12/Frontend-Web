import { useState } from 'react'
import MainMenu from './pages/MainMenu'
import Customization from './pages/Customization'

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu')

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen)
  }

  return (
    <>
      {currentScreen === 'menu' && <MainMenu onNavigate={navigateTo} />}
      {currentScreen === 'customization' && <Customization onNavigate={navigateTo} />}
    </>
  )
}

export default App
