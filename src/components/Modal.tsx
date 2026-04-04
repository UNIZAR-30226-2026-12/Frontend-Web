import React from 'react'
import '../styles/components/Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
}

function Modal({ isOpen, onClose, children, maxWidth, showCloseButton = true }: ModalProps) {
  const [isMouseDownOnOverlay, setIsMouseDownOnOverlay] = React.useState(false)

  if (!isOpen) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    // Guardamos si el clic empezó en el fondo (overlay)
    if (e.target === e.currentTarget) {
      setIsMouseDownOnOverlay(true)
    } else {
      setIsMouseDownOnOverlay(false)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Solo cerramos si empezó y terminó en el fondo (overlay)
    if (e.target === e.currentTarget && isMouseDownOnOverlay) {
      onClose()
    }
    setIsMouseDownOnOverlay(false)
  }

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
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
