import Modal from './Modal'
import '../styles/components/ConfirmModal.css'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    isLoading?: boolean
}

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    isLoading = false,
}: ConfirmModalProps) {
    const titleId = 'confirm-modal-title'
    const descId = 'confirm-modal-desc'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            overlayClassName="popup-overlay"
            boxClassName="popup-box popup-box--compact"
            closeButtonClassName="popup-close"
            dialogRole="alertdialog"
            ariaLabelledBy={titleId}
            ariaDescribedBy={descId}
        >
            <div className="confirm-modal popup-surface">
                <h2 className="confirm-modal__title" id={titleId}>{title}</h2>
                <p className="confirm-modal__message" id={descId}>{message}</p>
                <div className="confirm-modal__actions">
                    <button
                        type="button"
                        className="confirm-modal__btn confirm-modal__btn--cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="confirm-modal__btn confirm-modal__btn--confirm"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Eliminando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default ConfirmModal
