import Modal from './Modal'
import './AuthForms.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2 className="auth-form__title">Iniciar Sesión</h2>
        <p className="auth-form__subtitle">Bienvenido de vuelta a Random Reversi</p>

        <form className="auth-form__fields" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-form__label">
            Correo electrónico
            <input
              type="email"
              className="auth-form__input"
              placeholder="tu@email.com"
            />
          </label>

          <label className="auth-form__label">
            Contraseña
            <input
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
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
