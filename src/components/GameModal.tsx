import { useState, useEffect } from 'react'
import Modal from './Modal'
import '../styles/components/GameModal.css'

type BaseMode = '1vs1' | '1vs1vs1vs1'
export type GameMode = '1vs1' | '1vs1_skills' | '1vs1vs1vs1' | '1vs1vs1vs1_skills'

interface GameModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    subtitle?: string
    onSelectMode?: (mode: GameMode) => void
    availableModes?: BaseMode[]
    isLoading?: boolean
}

interface PreviewCell {
    color?: 'white' | 'black' | 'red' | 'blue'
    gridArea: string
}

const oneVsOnePreviewCells: PreviewCell[] = [
    { color: 'white', gridArea: '4 / 4' },
    { color: 'black', gridArea: '4 / 5' },
    { color: 'black', gridArea: '5 / 4' },
    { color: 'white', gridArea: '5 / 5' },
]

const oneVsOneSpecialCells: PreviewCell[] = [
    { gridArea: '2 / 7' },
    { gridArea: '6 / 2' },
    { gridArea: '2 / 2' },
    { gridArea: '7 / 6' },
]

const fourPlayersPreviewCells: PreviewCell[] = [
    { color: 'black', gridArea: '4 / 4' },
    { color: 'white', gridArea: '4 / 5' },
    { color: 'red', gridArea: '5 / 4' },
    { color: 'blue', gridArea: '5 / 5' },
    { color: 'white', gridArea: '4 / 12' },
    { color: 'black', gridArea: '4 / 13' },
    { color: 'blue', gridArea: '5 / 12' },
    { color: 'red', gridArea: '5 / 13' },
    { color: 'red', gridArea: '12 / 4' },
    { color: 'blue', gridArea: '12 / 5' },
    { color: 'black', gridArea: '13 / 4' },
    { color: 'white', gridArea: '13 / 5' },
    { color: 'blue', gridArea: '12 / 12' },
    { color: 'red', gridArea: '12 / 13' },
    { color: 'white', gridArea: '13 / 12' },
    { color: 'black', gridArea: '13 / 13' },
]

const fourPlayersSpecialCells: PreviewCell[] = [
    { gridArea: '2 / 10' },
    { gridArea: '10 / 2' },
    { gridArea: '15 / 12' },
    { gridArea: '3 / 15' },
    { gridArea: '8 / 7' },
]

function BoardPreview({ mode, withSkills }: { mode: BaseMode, withSkills: boolean }) {
    const isOneVsOne = mode === '1vs1'
    const sizeClass = isOneVsOne ? '8' : '16'
    const pieceCells = isOneVsOne ? oneVsOnePreviewCells : fourPlayersPreviewCells
    const specialCells = isOneVsOne ? oneVsOneSpecialCells : fourPlayersSpecialCells

    return (
        <div className={`board-preview board-preview--${sizeClass}`}>
            {withSkills && specialCells.map((cell) => (
                <div key={`special-${cell.gridArea}`} className="board-preview__special-cell" style={{ gridArea: cell.gridArea }}>?</div>
            ))}
            {pieceCells.map((cell) => (
                <div
                    key={`${cell.color}-${cell.gridArea}`}
                    className={`board-preview__piece board-preview__piece--${cell.color}`}
                    style={{ gridArea: cell.gridArea }}
                ></div>
            ))}
        </div>
    )
}

function GameModal({
    isOpen,
    onClose,
    title = "Seleccionar modo de juego",
    subtitle = "Elige que modo quieres jugar",
    onSelectMode,
    availableModes = ['1vs1', '1vs1vs1vs1'],
    isLoading = false,
}: GameModalProps) {
    const [step, setStep] = useState<'mode' | 'variant'>('mode')
    const [selectedMode, setSelectedMode] = useState<BaseMode | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setStep('mode')
            setSelectedMode(null)
        }
    }, [isOpen])

    const showOneVsOne = availableModes.includes('1vs1')
    const showFourPlayers = availableModes.includes('1vs1vs1vs1')
    const titleId = 'game-modal-title'
    const subtitleId = 'game-modal-subtitle'

    const handleModeClick = (mode: BaseMode) => {
        setSelectedMode(mode)
        setStep('variant')
    }

    const skillsMap: Record<BaseMode, GameMode> = {
        '1vs1': '1vs1_skills',
        '1vs1vs1vs1': '1vs1vs1vs1_skills',
    }

    const handleVariantClick = (withSkills: boolean) => {
        if (!selectedMode) return
        const finalMode: GameMode = withSkills ? skillsMap[selectedMode] : selectedMode
        onSelectMode?.(finalMode)
    }

    const handleBack = () => {
        setStep('mode')
        setSelectedMode(null)
    }

    const handleClose = () => {
        setStep('mode')
        setSelectedMode(null)
        onClose()
    }

    const stepTitle = step === 'variant'
        ? (selectedMode === '1vs1' ? '1 vs 1 · Elige variante' : '1 vs 1 vs 1 vs 1 · Elige variante')
        : title
    const stepSubtitle = step === 'variant'
        ? 'Selecciona si quieres jugar con o sin habilidades especiales'
        : subtitle

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="650px"
            overlayClassName="popup-overlay"
            boxClassName="popup-box popup-box--game"
            closeButtonClassName="popup-close"
            ariaLabelledBy={titleId}
            ariaDescribedBy={subtitleId}
        >
            <div className="game-modal popup-surface">
                {step === 'variant' && (
                    <button
                        type="button"
                        className="game-modal__back-btn"
                        onClick={handleBack}
                        aria-label="Volver a selección de modo"
                    >
                        Atrás
                    </button>
                )}

                <h2 className="game-modal__title" id={titleId}>{stepTitle}</h2>
                <p className="game-modal__subtitle" id={subtitleId}>{stepSubtitle}</p>

                {step === 'mode' && (
                    <div className="game-modal__options">
                        {showOneVsOne && (
                            <button type="button" className="game-modal__option" onClick={() => handleModeClick('1vs1')} disabled={isLoading}>
                                <div className="game-modal__option-icon">
                                    <BoardPreview mode="1vs1" withSkills={true} />
                                </div>
                                <div className="game-modal__option-info">
                                    <span className="game-modal__option-name">1 vs 1</span>
                                    <span className="game-modal__option-desc">Duelo de 2 jugadores</span>
                                </div>
                            </button>
                        )}

                        {showFourPlayers && (
                            <button type="button" className="game-modal__option" onClick={() => handleModeClick('1vs1vs1vs1')} disabled={isLoading}>
                                <div className="game-modal__option-icon">
                                    <BoardPreview mode="1vs1vs1vs1" withSkills={true} />
                                </div>
                                <div className="game-modal__option-info">
                                    <span className="game-modal__option-name">1 vs 1 vs 1 vs 1</span>
                                    <span className="game-modal__option-desc">Todos contra todos de 4 jugadores</span>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {step === 'variant' && (
                    <div className="game-modal__options">
                        <button type="button" className="game-modal__option" onClick={() => handleVariantClick(false)} disabled={isLoading}>
                            <div className="game-modal__option-icon">
                                <BoardPreview mode={selectedMode!} withSkills={false} />
                            </div>
                            <div className="game-modal__option-info">
                                <span className="game-modal__option-name">Clásico</span>
                                <span className="game-modal__option-desc">Juego sin habilidades especiales</span>
                            </div>
                        </button>

                        <button type="button" className="game-modal__option" onClick={() => handleVariantClick(true)} disabled={isLoading}>
                            <div className="game-modal__option-icon">
                                <BoardPreview mode={selectedMode!} withSkills={true} />
                            </div>
                            <div className="game-modal__option-info">
                                <span className="game-modal__option-name">Con Habilidades</span>
                                <span className="game-modal__option-desc">Juego con habilidades especiales</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default GameModal
