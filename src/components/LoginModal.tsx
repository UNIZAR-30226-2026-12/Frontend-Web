import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import './AuthForms.css'

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

      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        onNavigate('menu')
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor')
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
