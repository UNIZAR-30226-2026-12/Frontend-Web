import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import Modal from './Modal'
import '../styles/components/AuthForms.css'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterSuccess: () => void
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

function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      await api.auth.register({
        username,
        email,
        password
      })
      onRegisterSuccess()
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2 className="auth-form__title">Crear Cuenta</h2>
        <p className="auth-form__subtitle">Únete a Random Reversi</p>

        <form className="auth-form__fields" onSubmit={handleRegister}>
          {error && <div className="auth-form__error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <label className="auth-form__label">
            Nombre de usuario
            <input
              type="text"
              className="auth-form__input"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="auth-form__label">
            Correo electrónico
            <input
              type="email"
              className="auth-form__input"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <label className="auth-form__label">
            Confirmar contraseña
            <div className="auth-form__password-field">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="auth-form__input auth-form__input--password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-form__password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showConfirmPassword}
              >
                <PasswordEyeIcon hidden={!showConfirmPassword} />
              </button>
            </div>
          </label>

          <button type="submit" className="auth-form__btn">
            Registrarse
          </button>
        </form>
      </div>
    </Modal>
  )
}

export default RegisterModal
