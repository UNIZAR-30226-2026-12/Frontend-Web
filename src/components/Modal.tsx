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
  dialogRole?: 'dialog' | 'alertdialog'
  ariaLabelledBy?: string
  ariaDescribedBy?: string
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
  dialogRole = 'dialog',
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalProps) {
  const [isMouseDownOnOverlay, setIsMouseDownOnOverlay] = React.useState(false)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)
  const previousFocusedElementRef = React.useRef<HTMLElement | null>(null)

  const overlayClasses = ['modal-overlay', overlayClassName].filter(Boolean).join(' ')
  const boxClasses = ['modal-box', boxClassName].filter(Boolean).join(' ')
  const closeClasses = ['modal-close', closeButtonClassName].filter(Boolean).join(' ')

  const getFocusableElements = () => {
    if (!boxRef.current) return []

    return Array.from(
      boxRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)
  }

  React.useEffect(() => {
    if (!isOpen) return

    previousFocusedElementRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTarget = getFocusableElements()[0] ?? closeButtonRef.current ?? boxRef.current
    window.requestAnimationFrame(() => {
      focusTarget?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        boxRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (activeElement === firstElement || !boxRef.current?.contains(activeElement)) {
          event.preventDefault()
          lastElement.focus()
        }
      } else if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocusedElementRef.current?.focus?.()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!isOpen) return null

  return (
    <div
      className={overlayClasses}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={boxClasses}
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        style={maxWidth ? { maxWidth } : undefined}
        role={dialogRole}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {showCloseButton && (
          <button
            type="button"
            className={closeClasses}
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
            ref={closeButtonRef}
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
