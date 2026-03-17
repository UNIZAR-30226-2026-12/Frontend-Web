import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import Modal from './Modal'
import '../styles/components/AuthForms.css'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterSuccess: () => void
}

function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
            <input
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="auth-form__label">
            Confirmar contraseña
            <input
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
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
