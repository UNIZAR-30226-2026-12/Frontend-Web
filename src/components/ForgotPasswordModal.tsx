import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import Modal from './Modal'
import '../styles/components/AuthForms.css'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await api.auth.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor')
    }
  }

  const handleClose = () => {
    setEmail('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="auth-form">
        <h2 className="auth-form__title">Restablecer Contraseña</h2>

        {success ? (
          <p className="auth-form__success">
            Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.
          </p>
        ) : (
          <form className="auth-form__fields" onSubmit={handleSubmit}>
            {error && <div className="auth-form__error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            <label className="auth-form__label">
              Introduce tu correo electrónico
              <input
                type="email"
                className="auth-form__input"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="auth-form__btn">
              Restablecer contraseña
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default ForgotPasswordModal
