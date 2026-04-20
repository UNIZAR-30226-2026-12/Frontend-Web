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
  const titleId = 'forgot-password-modal-title'
  const errorId = 'forgot-password-modal-error'
  const successId = 'forgot-password-modal-success'

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="popup-overlay"
      boxClassName="popup-box popup-box--compact"
      closeButtonClassName="popup-close"
      ariaLabelledBy={titleId}
      ariaDescribedBy={success ? successId : error ? errorId : undefined}
    >
      <div className="auth-form auth-form--popup popup-surface">
        <h2 className="auth-form__title" id={titleId}>Restablecer Contraseña</h2>

        {success ? (
          <p className="auth-form__success" id={successId} role="status" aria-live="polite">
            Revise la bandeja de entrada de su correo electrónico para restablecer su contraseña.
          </p>
        ) : (
          <form className="auth-form__fields" onSubmit={handleSubmit}>
            {error && <div className="auth-form__error" id={errorId} role="alert">{error}</div>}
            <label className="auth-form__label" htmlFor="forgot-password-email">
              Introduce tu correo electrónico
              <input
                id="forgot-password-email"
                type="email"
                className="auth-form__input"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                autoComplete="email"
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

