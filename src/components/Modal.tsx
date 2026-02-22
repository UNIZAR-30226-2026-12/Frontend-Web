import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
}

function Modal({ isOpen, onClose, children, maxWidth, showCloseButton = true }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {showCloseButton && (
          <button className="modal-close" onClick={onClose}>
            x
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
