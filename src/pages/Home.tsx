import { useState, useCallback, useEffect } from 'react'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import menuBackground from '../assets/elementosGenerales/nuevoFondoReversi.png'
import logoReversi from '../assets/elementosGenerales/logoReversi.png'
import questionMark from '../assets/elementosGenerales/interrogante.png'
import greenChip from '../assets/elementosGenerales/fichaVerde.png'
import redChip from '../assets/elementosGenerales/fichaRoja.png'
import robotMascot from '../assets/inicio/robotSentado.png'
import loginButton from '../assets/inicio/botonIniciarSesion.png'
import createAccountButton from '../assets/inicio/botonRegistroBeige.png'
import '../styles/pages/Home.css'

interface HomeProps {
  onNavigate: (screen: string, data?: any) => void
  initialLoginMessage?: string
  initialLoginMessageType?: 'success' | 'warning'
  onLoginMessageShown?: () => void
}

function Home({ onNavigate, initialLoginMessage, initialLoginMessageType = 'success', onLoginMessageShown }: HomeProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('')
  const [loginSuccessMessageType, setLoginSuccessMessageType] = useState<'success' | 'warning'>('success')

  const handleCloseForgotPassword = useCallback(() => setShowForgotPassword(false), [])

  useEffect(() => {
    if (!initialLoginMessage) return
    setLoginSuccessMessage(initialLoginMessage)
    setLoginSuccessMessageType(initialLoginMessageType)
    setShowLogin(true)
    onLoginMessageShown?.()
  }, [initialLoginMessage, initialLoginMessageType, onLoginMessageShown])

  return (
    <div className="home">
      <img className="home__background" src={menuBackground} alt="" aria-hidden="true" />
      <div className="home__overlay" aria-hidden="true"></div>

      <div className="home__decorations" aria-hidden="true">
        <img className="home__chip home__chip--red home__chip--top-left" src={redChip} alt="" />
        <img className="home__chip home__chip--green home__chip--top-right" src={greenChip} alt="" />
        <img className="home__chip home__chip--green home__chip--mid-right" src={greenChip} alt="" />
        <img className="home__chip home__chip--green home__chip--bottom-right" src={greenChip} alt="" />
        <img className="home__chip home__chip--green home__chip--mid-left" src={greenChip} alt="" />
        <img className="home__chip home__chip--red home__chip--bottom-left" src={redChip} alt="" />

        <img className="home__question home__question--1" src={questionMark} alt="" />
        <img className="home__question home__question--2" src={questionMark} alt="" />
        <img className="home__question home__question--3" src={questionMark} alt="" />
        <img className="home__question home__question--4" src={questionMark} alt="" />
      </div>

      <main className="home__content">
        <h1 className="sr-only">Random Reversi</h1>
        <img className="home__logo" src={logoReversi} alt="Random Reversi" />

        <section className="home__message" aria-label="Descripcion del juego">
          <span className="home__tape home__tape--left"></span>
          <span className="home__tape home__tape--right"></span>
          <p className="home__subtitle">
            El clasico Reversi reinventado con habilidades especiales,
            casillas sorpresa y partidas de hasta 4 jugadores.
          </p>
        </section>

        <div className="home__actions">
          <button
            className="home__image-button home__image-button--login"
            onClick={() => setShowLogin(true)}
            aria-label="Iniciar Sesión"
          >
            <img src={loginButton} alt="" />
          </button>

          <button
            className="home__image-button home__image-button--create"
            onClick={() => setShowRegister(true)}
            aria-label="Crear Cuenta"
          >
            <img src={createAccountButton} alt="" />
          </button>
        </div>

        <footer className="home__footer">
          <p>HuQ Games Studio · Universidad de Zaragoza</p>
        </footer>
      </main>

      <img className="home__mascot" src={robotMascot} alt="" aria-hidden="true" />

      <LoginModal
        isOpen={showLogin}
        onClose={() => { setShowLogin(false); setLoginSuccessMessage('') }}
        onNavigate={onNavigate}
        onForgotPassword={() => setShowForgotPassword(true)}
        successMessage={loginSuccessMessage}
        successMessageType={loginSuccessMessageType}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onRegisterSuccess={() => {
          setShowRegister(false)
          setLoginSuccessMessage('Cuenta creada correctamente. Ya puedes iniciar sesión.')
          setShowLogin(true)
        }}
      />
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={handleCloseForgotPassword} />
    </div>
  )
}

export default Home




