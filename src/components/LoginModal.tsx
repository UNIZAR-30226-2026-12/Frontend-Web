import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import Modal from './Modal'
import loginPostit from '../assets/inicio/positIniciarSesion.png'
import loginMascot from '../assets/inicio/robotSentado.png'
import enterButton from '../assets/elementosGenerales/botonEntrar.png'
import '../styles/components/AuthForms.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: string) => void
  onForgotPassword: () => void
  successMessage?: string
  successMessageType?: 'success' | 'warning'
}

function PasswordEyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="auth-form__password-icon">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {hidden && (
        <path
          d="M4 4l16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function LoginModal({ isOpen, onClose, onNavigate, onForgotPassword, successMessage, successMessageType = 'success' }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const titleId = 'login-modal-title'
  const errorId = 'login-modal-error'

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const data = await api.auth.login(formData)
      localStorage.setItem('token', data.access_token)
      onNavigate('menu')
      onClose()
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      overlayClassName="auth-modal-overlay"
      boxClassName="auth-modal-box auth-modal-box--login"
      ariaLabelledBy={titleId}
      ariaDescribedBy={error ? errorId : undefined}
    >
      <div className="auth-form auth-form--prototype auth-form--login">
        <img className="auth-form__paper" src={loginPostit} alt="" aria-hidden="true" />
        <img className="auth-form__mascot auth-form__mascot--login" src={loginMascot} alt="" aria-hidden="true" />

        <div className="auth-form__content">
          <h2 className="auth-form__sr-title" id={titleId}>Iniciar Sesión</h2>

          <form className="auth-form__fields" onSubmit={handleLogin}>
            {successMessage && <div className={`auth-form__success auth-form__success--${successMessageType}`} role="status">{successMessage}</div>}
            {error && <div className="auth-form__error" id={errorId} role="alert">{error}</div>}

            <label className="auth-form__label">
              Usuario o Correo
              <input
                type="text"
                className="auth-form__input"
                placeholder="Tu Usuario o Correo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                autoComplete="username"
                required
              />
            </label>

            <label className="auth-form__label">
              Contraseña
              <div className="auth-form__password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-form__input auth-form__input--password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : undefined}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-form__password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  <PasswordEyeIcon hidden={!showPassword} />
                </button>
              </div>
            </label>

            <button type="submit" className="auth-form__image-submit" aria-label="Entrar">
              <img src={enterButton} alt="" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="auth-form__forgot-link"
              onClick={() => {
                onClose()
                onForgotPassword()
              }}
            >
              ¿Has olvidado tu contraseña?
            </button>
          </form>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal

