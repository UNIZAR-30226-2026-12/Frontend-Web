import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import Modal from './Modal'
import '../styles/components/AuthForms.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: string) => void
}

function LoginModal({ isOpen, onClose, onNavigate }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
            Usuario
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

          <button type="submit" className="auth-form__btn">
            Entrar
          </button>
        </form>
      </div>
    </Modal>
  )
}

export default LoginModal
