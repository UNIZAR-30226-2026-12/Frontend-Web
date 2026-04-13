import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import Modal from './Modal'
import '../styles/components/AuthForms.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: string) => void
  onForgotPassword: () => void
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

function LoginModal({ isOpen, onClose, onNavigate, onForgotPassword }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2 className="auth-form__title">Iniciar Sesión</h2>
        <p className="auth-form__subtitle">Bienvenido de vuelta a Random Reversi</p>

        <form className="auth-form__fields" onSubmit={handleLogin}>
          {error && <div className="auth-form__error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <label className="auth-form__label">
            Usuario o Correo
            <input
              type="text"
              className="auth-form__input"
              placeholder="Tu Usuario o Correo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="auth-form__label">
            Contraseña
            <div className="auth-form__password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-form__input auth-form__input--password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="auth-form__btn">
            Entrar
          </button>

          <button
            type="button"
            className="auth-form__forgot-link"
            onClick={() => { onClose(); onForgotPassword() }}
          >
            ¿Has olvidado tu contraseña?
          </button>
        </form>
      </div>
    </Modal>
  )
}

export default LoginModal
