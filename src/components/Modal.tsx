import React from 'react'
import '../styles/components/Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
  overlayClassName?: string
  boxClassName?: string
  closeButtonClassName?: string
}

function Modal({
  isOpen,
  onClose,
  children,
  maxWidth,
  showCloseButton = true,
  overlayClassName,
  boxClassName,
  closeButtonClassName,
}: ModalProps) {
  const [isMouseDownOnOverlay, setIsMouseDownOnOverlay] = React.useState(false)

  if (!isOpen) return null

  const overlayClasses = ['modal-overlay', overlayClassName].filter(Boolean).join(' ')
  const boxClasses = ['modal-box', boxClassName].filter(Boolean).join(' ')
  const closeClasses = ['modal-close', closeButtonClassName].filter(Boolean).join(' ')

  const handleMouseDown = (e: React.MouseEvent) => {
    // Save if the click starts on the overlay itself.
    if (e.target === e.currentTarget) {
      setIsMouseDownOnOverlay(true)
    } else {
      setIsMouseDownOnOverlay(false)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Close only if mouse down and up both happen on the overlay.
    if (e.target === e.currentTarget && isMouseDownOnOverlay) {
      onClose()
    }
    setIsMouseDownOnOverlay(false)
  }

  return (
    <div
      className={overlayClasses}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={boxClasses}
        onClick={(e) => e.stopPropagation()}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {showCloseButton && (
          <button
            type="button"
            className={closeClasses}
            onClick={onClose}
          >
            x
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
