import Modal from './Modal'
import './AuthForms.css'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
}

function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2 className="auth-form__title">Crear Cuenta</h2>
        <p className="auth-form__subtitle">Únete a Random Reversi</p>

        <form className="auth-form__fields" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-form__label">
            Nombre de usuario
            <input
              type="text"
              className="auth-form__input"
              placeholder="Tu nombre de usuario"
            />
          </label>

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

          <label className="auth-form__label">
            Confirmar contraseña
            <input
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
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
